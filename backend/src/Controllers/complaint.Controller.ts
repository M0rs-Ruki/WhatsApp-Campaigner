import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Complaint, { ComplaintStatus } from '../Models/complaints.Model.js';
import User, { IUser, UserRole } from '../Models/user.Model.js';

// CREATE COMPLAINT - Everyone can create
export const createComplaint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const userId = (req.user as IUser)._id;
    const { subject, description } = req.body;

    // Validation
    if (!subject || !description) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: 'Subject and description are required.',
      });
      return;
    }

    // Validate subject word count (1-30 words)
    const subjectWordCount = subject.trim().split(/\s+/).length;
    if (subjectWordCount < 1 || subjectWordCount > 30) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: 'Subject must be between 1 and 30 words.',
      });
      return;
    }

    // Create complaint
    const complaintArray = await Complaint.create([{
      createdBy: userId,
      subject: subject.trim(),
      description: description.trim(),
      status: ComplaintStatus.PENDING
    }], { session });

    const newComplaint = complaintArray[0];

    // Push complaint ID to user's allComplaint array
    await User.findByIdAndUpdate(
      userId,
      { $push: { allComplaint: newComplaint._id } },
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Complaint created successfully.',
      data: {
        complaintId: newComplaint._id,
        subject: newComplaint.subject,
        description: newComplaint.description,
        status: newComplaint.status,
        createdAt: newComplaint.createdAt
      }
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error creating complaint:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating complaint',
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// DELETE COMPLAINT - Creator or Admin
export const deleteComplaint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const userId = (req.user as IUser)._id;
    const userRole = (req.user as IUser).role;
    const { complaintId } = req.params;

    if (!complaintId) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: 'Complaint ID is required.',
      });
      return;
    }

    // Find complaint
    const complaint = await Complaint.findById(complaintId).session(session);

    if (!complaint) {
      await session.abortTransaction();
      res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
      return;
    }

    // Check permissions: creator or admin
    const isCreator = complaint.createdBy.toString() === userId.toString();
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isCreator && !isAdmin) {
      await session.abortTransaction();
      res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this complaint.',
      });
      return;
    }

    // Delete complaint
    await Complaint.findByIdAndDelete(complaintId).session(session);

    // Remove from user's allComplaint array
    await User.findByIdAndUpdate(
      complaint.createdBy,
      { $pull: { allComplaint: complaintId } },
      { session }
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully.',
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error deleting complaint:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting complaint',
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// UPDATE COMPLAINT - Admin only (update status and add response)
export const updateComplaint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const userId = (req.user as IUser)._id;
    const userRole = (req.user as IUser).role;
    const { complaintId } = req.params;
    const { status, adminResponse } = req.body;

    // Check if user is admin
    if (userRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admin can update complaints.',
      });
      return;
    }

    if (!complaintId) {
      res.status(400).json({
        success: false,
        message: 'Complaint ID is required.',
      });
      return;
    }

    // Find complaint
    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
      return;
    }

    // Update fields
    if (status) {
      // Validate status
      if (!Object.values(ComplaintStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status value.',
        });
        return;
      }
      complaint.status = status;
    }

    if (adminResponse) {
      complaint.adminResponse = adminResponse.trim();
    }

    // Set resolvedBy if status is resolved or closed
    if (status === ComplaintStatus.RESOLVED || status === ComplaintStatus.CLOSED) {
      complaint.resolvedBy = userId as any;
      // resolvedAt will be set automatically by the pre-save middleware
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully.',
      data: {
        complaintId: complaint._id,
        subject: complaint.subject,
        status: complaint.status,
        adminResponse: complaint.adminResponse,
        resolvedBy: complaint.resolvedBy,
        resolvedAt: complaint.resolvedAt,
        updatedAt: complaint.updatedAt
      }
    });
  } catch (error: any) {
    console.error('Error updating complaint:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating complaint',
      error: error.message,
    });
  }
};

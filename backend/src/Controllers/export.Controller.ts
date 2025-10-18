import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import Campaign from '../Models/Campaign.model.js';
import User from '../Models/user.Model.js';

export const exportCampaignToExcel = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User not found.',
            });
        }

        const { campaignId } = req.params;

        if (!campaignId) {
            return res.status(400).json({
                success: false,
                message: 'Campaign ID is required.',
            });
        }

        // Fetch campaign with full details
        const campaign = await Campaign.findById(campaignId)
            .populate('createdBy', 'companyName')
            .lean();

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found.',
            });
        }

        // Verify user owns this campaign (through allCampaign array)
        const currentUser = await User.findById(user._id).select('allCampaign').lean();
        const hasCampaign = currentUser?.allCampaign?.some(
            (cId) => cId.toString() === campaignId
        );

        if (!hasCampaign) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to export this campaign.',
            });
        }

        // Create new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Campaign Data');

        // Define columns (without Entry Type)
        worksheet.columns = [
            { header: 'Campaign Name', key: 'campaignName', width: 30 },
            { header: 'Message', key: 'message', width: 50 },
            { header: 'Phone Button Text', key: 'phoneButtonText', width: 20 },
            { header: 'Phone Button Number', key: 'phoneButtonNumber', width: 20 },
            { header: 'Link Button Text', key: 'linkButtonText', width: 20 },
            { header: 'Link Button URL', key: 'linkButtonUrl', width: 40 },
            { header: 'Created By', key: 'createdBy', width: 25 },
            { header: 'Country Code', key: 'countryCode', width: 15 },
            { header: 'Phone Number', key: 'phoneNumber', width: 20 },
            { header: 'Media URL', key: 'mediaUrl', width: 50 },
            { header: 'Created Date', key: 'createdDate', width: 15 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, size: 12 };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF22C55E' },
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 25;

        // Format created date (YYYY-MM-DD)
        const formatDate = (dateString: string | Date): string => {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Add rows (one per phone number)
        const createdByName = (campaign.createdBy as any)?.companyName || 'Unknown';
        const createdDate = formatDate(campaign.createdAt);

        campaign.mobileNumbers.forEach((phoneNumber) => {
            worksheet.addRow({
                campaignName: campaign.campaignName,
                message: campaign.message,
                phoneButtonText: campaign.phoneButton?.text || '',
                phoneButtonNumber: campaign.phoneButton?.number || '',
                linkButtonText: campaign.linkButton?.text || '',
                linkButtonUrl: campaign.linkButton?.url || '',
                createdBy: createdByName,
                countryCode: campaign.countryCode,
                phoneNumber: phoneNumber,
                mediaUrl: campaign.media || '',
                createdDate: createdDate,
            });
        });

        // Add alternating row colors
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && rowNumber % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF3F4F6' }, // Light gray
                };
            }
        });

        // Add borders to all cells
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                };
            });
        });

        // Generate file name
        const fileName = `${Date.now()}_campaign_${campaign.campaignName}.xlsx`;

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error: unknown) {
        console.error('Error in exportCampaignToExcel controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while exporting campaign.',
        });
    }
};

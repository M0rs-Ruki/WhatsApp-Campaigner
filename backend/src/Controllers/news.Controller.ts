
import { Request, Response } from 'express';
import News from '../Models/news.Model.js';

const createNews = async (req: Request, res: Response) => {
    try {
        const { title, description, status } = req.body;


        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required in order to create news.',
            });
        };

        const newNews = new News({
            title,
            description,
            status,
            createdBy: user._id,
        });

        await newNews.save();

        res.status(201).json({
            success: true,
            message: 'News created successfully',
            data: newNews,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({
            success: false,
            message: 'Error creating news',
            error: errorMessage
        });
    }
};

const updateNews = async (req: Request, res: Response) => {
    try {
        const { title, description, status } = req.body;
        const { newsId } = req.params;


        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required in order to update news.',
            });
        }

        const updatedNews = await News.findByIdAndUpdate(
            newsId,
            { title, description, status },
            { new: true, runValidators: true }
        );
        if (!updatedNews) {
            return res.status(404).json({
                success: false,
                message: 'News not found ',
            });
        }

        res.status(200).json({
            success: true,
            message: 'News updated successfully',
            data: updatedNews,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred During news update';
        res.status(500).json({
            success: false,
            message: 'Error updating news',
            error: errorMessage
        });
    }
};


const deleteNews = async (req: Request, res: Response) => {
    try {
        const { newsId } = req.params;

        const news = await News.findByIdAndDelete(newsId);
        if (!news) {
            return res.status(404).json({
                success: false,
                message: 'News not found'
            });
        }

        

        res.status(200).json({
            success: true,
            message: 'News deleted successfully',
            data: news,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred During news deletion';
        res.status(500).json({
            success: false,
            message: 'Error deleting news',
            error: errorMessage
        });
    }
};


export { createNews, updateNews, deleteNews };

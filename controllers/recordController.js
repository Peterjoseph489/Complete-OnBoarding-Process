const recordModel = require('../models/recordModel');
const userModel = require('../models/userModel');

const createRecord = async (req, res)=>{
    try {
        const { math, english } = req.body;
        const record = new recordModel({
            math,
            english
        })
        const savedRecords = await record.save();
        res.status(201).json({
            data: savedRecords
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}


const getRecords = async (req, res)=>{
    try {
        const authenticatedUser = await userModel.findById(req.params.id);
        const records = await recordModel.find();
        res.status(201).json({
            data: records
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}


const getRecord = async (req, res)=>{
    try {
        const { recordId } = req.params;
        const record = await recordModel.findById(recordId);
        res.status(201).json({
            data: record
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}


const updateRecord = async (req, res)=>{
    try {
        const { recordId } = req.params;
        const record = await recordModel.findById(recordId);
        const { math, english } = req.body
        const data = {
            math: math || record.math,
            english: english || record.english
        }
        const updatedrecord = await recordModel.findByIdAndUpdate(recordId, data, {new: true});
        if (!updatedrecord) {
            res.status(400).json({
                message: 'Record cannot be updated'
            })
        } else {
            res.status(201).json({
                data: updatedrecord
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}


const deleteRecord = async (req, res)=>{
    try {
        const { recordId } = req.params;
        const deleterecord = await recordModel.findByIdAndDelete(recordId);
        res.status(201).json({
            message: 'Record deleted successfully',
            data: deleterecord,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}



module.exports = {createRecord, getRecords, getRecord, updateRecord, deleteRecord}
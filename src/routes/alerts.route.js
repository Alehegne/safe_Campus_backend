const alertsRouter = require("express").Router();
const verifyToken = require("../middleware/verifyToken");
const AlertsModel = require("../models/alerts.model");
const sendResponse = require("../utils/sendResponse");


async function getAlerts(req,res){
    try {
        //get all alerts wth type alert

        const alerts = await AlertsModel.find({type:"alert"}).sort({time:-1});
        return sendResponse(res,200,true,"alerts fetched successfully",alerts,null)
        
    } catch (error) {
         return sendResponse(res,500,false,"server error",null,null)
    }
}
async function getAnnouncements(req,res){
    try {
        const announcements = await AlertsModel.find({type:"announcement"}).sort({time:-1});
        return sendResponse(res,200,true,"Announcements retrieved successfully",announcements);
        
    } catch (error) {
         return sendResponse()
    }
}


alertsRouter.get("/alerts",verifyToken, getAlerts);
alertsRouter.get("/announcements",verifyToken,getAnnouncements);


module.exports = alertsRouter;
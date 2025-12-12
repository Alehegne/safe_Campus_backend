




const { times } = require("lodash");
const {default:mongoose} = require("mongoose");

const AlertsSchema = new mongoose.Schema({
     title:{
        type:String,
        required:true
     },
     content:{
        type:String,
        required:true
     },
     time:{
        type:Date,
        default:Date.now
     },
     status:{
         type:String,
         enum:["low","medium","high"]
     },
     type:{
        type:String,
        enum:["alert","announcement"]
     },
   //   scheduled announcements for users by admin
       scheduledTime:{
         type:Date,
         default:null
       },
       //target audience for announcement
         targetAudience:{
             type:String,
               enum:["all","students","staff","faculty"],
               default:"all"
         }
       },{timestamps:true});


module.exports=mongoose.model("Alerts",AlertsSchema);
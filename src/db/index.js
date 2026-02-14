import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const DBConnect = async () => {
    try {
       const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`${connectionInstance.connection.host}`)
        
    } catch (error) {
        console.error("ERROR : ", error)
        process.exit(1)
    }
}

export default DBConnect
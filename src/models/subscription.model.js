import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema ({
    subscriber : {
        type : Schema.Types.ObjectId, // one who is subscribing
        ref : "User"
    },
    channel : {
        type : Schema.Types.ObjectId, // one to whom subscriber is subscribing
        ref : "User"
    }
}, {
    timestamps : true
})

export const Subscription = mongoose.model("Subscription" , subscriptionSchema)


// Every time a subscription is done , a page is created containing channel and subscriber 
// To count and see number and who have subscribed to a channel , we count the number of pages containing the channel
// To count and see number and to which channek subscriber has subscribed to , we count the number of pages containing the subscriber .
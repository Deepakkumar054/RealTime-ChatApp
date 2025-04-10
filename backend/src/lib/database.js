
import mongoose from 'mongoose';

const connectDb= ()=>{
    mongoose.connect(process.env.MONGODB_URL)
    .then(()=>{console.log("Database connected succesfully")})
    .catch((err)=>{
        console.log("Db connection issues");
        console.error(err);
        process.exit(1);
          
    })
}
export default connectDb;
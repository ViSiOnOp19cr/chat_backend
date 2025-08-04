import express,{Request,Response, RequestHandler} from 'express'
import {signup,login,updateProfile, checkAuth, getProfile} from '../controllers/userController';
import { authmiddleware } from '../middleware/middlewares';
const router = express.Router();

router.post("/signup", (req, res) => { 
    signup(req,res);
});
router.post("/login", (req, res) => {
    login(req,res);
});
router.put("/update-profile", authmiddleware as RequestHandler,(req,res)=>{
    updateProfile(req,res);
})
router.get("/check", authmiddleware as RequestHandler,(req,res)=>{
    checkAuth(req,res);
});
router.get("/profile", authmiddleware as RequestHandler, (req,res) => {
    getProfile(req,res);
});
export { router as userRouter};


'use strict'

import AddressComponent from '../../prototype/addressComponent'
import formidable from 'formidable'
import UserInfoModel from '../../models/v2/userInfo'
import UserModel from '../../models/v2/user'
import crypto from 'crypto'
import dtime from 'time-formater'

class User extends AddressComponent{
    constructor(){
        super();
        this.login=this.login.bind(this);
        this.encryption=this.encryption.bind(this);
        this.changePassword=this.changePassword.bind(this);
        this.updateAvatar=this.updateAvatar.bind(this);
    }

    async login(req,res,next){
        const cap=req.cookie.cap;
        if(!cap){
            console.log('验证码失效');
            res.send({
                status:0,
                type:'ERROR_CAPTCHA',
                message:'验证码失效'
            });
            return;
        }
        const form=new formidable.IncomingForm();
        form.parse(req,async(err,fields,files)=>{
            const {username,password,captcha_code}=fields;
            try{
                if(!username){
                    throw new Error('用户名参数错误')
                }else if(!password){
                    throw new Error('密码参数错误');
                }else if(!captcha_code){
                    throw new Error('验证码参数错误');
                }
            }catch(err){
                console.log('登录参数错误',err);
                res.send({
                    status:0,
                    type:'ERROR_QUERY',
                    message:err.message
                });
                return;
            }
            if(cap.toString() !== captcha_code.toString()){
                res.send({
                    status:0,
                    type:'ERROR_CAPTCHA',
                    message:'验证码不正确'
                });
                return;
            }
            const newpassword=this.encryption(password);
            try{
                const user=await UserModel.findOne({username});
                if(!user){
                    const user_id=await this.getId('user_id');
                    const cityInfo=await this.guessPosition(req);
                    const registe_time=dtime().format('YYYY-MM-DD HH:mm');
                    const newUser={username,password:newpassword,user_id};
                    const newUserInfo={username,user_id,id:user_id,city:cityInfo.city,registe_time};
                    UserModel.create(newUser);
                    const createUser=new UserInfoModel(newUserInfo);
                    const userinfo=await createUser.save();
                    req.session.user_id=user_id;
                    res.send(userinfo);
                }else if(user.password.toString() !== newpassword.toString()){
                    console.log('用户登录密码错误');
                    res.send({
                        status:0,
                        type:'ERROR_PASSWORD',
                        message:'密码错误'
                    });
                    return;
                }else{
                    req.session.user_id=user.user_id;
                    const userinfo=await UserInfoModel.findOne({user_id:user.user_id},'_id');
                    res.send(userinfo);
                }
            }catch(err){
                console.log('用户登录失败',err);
                res.send({
                    status:0,
                    type:'SAVE_USER_FAILED',
                    message:'登录失败'
                });
            }
        });
    }

    async getInfo(req,res,next){
        const sid=req.session.user_id;
        const qid=req.query.user_id;
        const user_id=sid || qid;
        if(!user_id || !Number(user_id)){
            res.send({
                status:0,
                type:'GET_USER_INFO_FAILD',
                message:'通过session获取用户信息失败'
            });
            return;
        }
        try{
            const userinfo=await UserInfoModel.findOne({user_id},'-_id');
            res.send(userinfo);
        }catch(err){
            console.log('通过session获取用户信息失败',err);
            res.send({
                status:0,
                type:'GET_USER_INFO_FAIELD',
                message:'通过session获取用户信息失败'
            });
        }
    }

    async getInfoById(req,res,next){
        const user_id=req.params.user_id;
        if(!user_id || !Number(user_id)){
            console.log('通过ID获取用户信息失败');
            res.send({
                status:0,
                type:'GET_USER_INFO_FAIELD',
                message:'通过ID获取用户信息失败'
            });
            return;
        }
        try{
            const userinfo=await UserInfoModel.findOne({user_id},'-_id');
            res.send(userinfo);
        }catch(err){
            console.log('通过用户ID获取用户信息失败',err);
            res.send({
                status:0,
                type:'GET_USER_INFO_FAIELD',
                message:'通过用户ID获取用户数据失败'
            });
        }
    }

    async signout(req,res,next){
        delete req.session.user_id;
        res.send({
            status:1,
            message:'退出成功'
        });
    }

    async changePassword(req,res,next){
        const cap=req.cookie.cap;
        if(!cap){
            console.log('验证码失效');
            res.send({
                status:0,
                type:'ERROR_CAPTCHA',
                message:'验证码失效'
            });
            return;
        }
        const form=new formidable.IncomingForm();
        form.parse(req,async (err,fields,files)=>{
            const {username,oldpassWord,newpassword,confirmpassword,captcha_code}=fields;
            try{
                if(!username){
                    throw new Error('用户名参数错误')
                }else if(!oldpassWord){
                    throw new Error('必须添加旧密码');
                }else if(!newpassword){
                    throw new Error('必须填写新密码');
                }else if(!confirmpassword){
                    throw new Error('必须填写确认密码');
                }else if(newpassword !== confirmpassword){
                    throw new Error('两次密码不一致');
                }else if(!captcha_code){
                    throw new Error('请填写验证码');
                }
            }catch(err){
                console.log('修改密码参数错误',err);
                res.send({
                    status:0,
                    type:'ERROR_QUERY',
                    message:err.message
                });
                return;
            }
            if(cap.toString() !== captcha_code.toString()){
                res.send({
                    status:0,
                    type:'ERROR_CAPTCHA',
                    message:'验证码不正确'
                });
                return;
            }
            const md5password=this.encryption(oldpassWord);
            try{
                const user=await UserModel.findOne({username});
                if(!user){
                    res.send({
                        status:0,
                        type:'USER_NOT_FOUND',
                        message:'未找到当前用户',
                    });
                }else if(user.password.toString() !== md5password.toString()){
                    res.send({
                        status:0,
                        type:'ERROR_PASSWORD',
                        message:'密码不正确'
                    });
                }else{
                    user.password=this.encryption(newpassword);
                    user.save();
                    res.send({
                        status:1,
                        success:'密码修改成功'
                    });
                }
            }catch(err){
                console.log('修改密码失败',err);
                
            }

        });
    }

    encryption(password){
        const newpassword=this.Md5(this.Md5(password).substr(2,7)+this.Md5(password));
        return newpassword;
    }
    Md5(password){
        const md5=crypto.createHash('md5')
        return md5.update(password).digest('base64')
    }
}
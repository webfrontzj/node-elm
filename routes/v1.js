'use strict';

import express from 'express'

const router=express.Router();

router.get('/cities',function(req,res,next){
    console.log(req);
    next();
})

export default router;
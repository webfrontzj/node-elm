'use strict'

import mongoose, { mongo } from 'mongoose'
import remarkData from '../../InitData/remark'

const remarkSchema=new mongoose.Schema({
    remarks:[],
});

const Remark =mongoose.model('Remark',remarkSchema);

Remark.findOne((err,data)=>{
    if(!data){
        Remark.create(remarkData);
    }
});

export default Remark;
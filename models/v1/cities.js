'use strict'

import mongoose from 'mongoose';
import cityData from '../../InitData/cities'

const citySchema=new mongoose.Schema({
    data:{}
});

citySchema.statics.cityGuess=function(name){
    return new Promise(async (resolve,reject)=>{
        const firstWord=name.substr(0,1).toUpperCase();
        try{
            const city=await this.findOne();
            console.log(city);
            Object.entries(city.data).forEach(item=>{
                if(item[0]==firstWord){
                    item[1].forEach(cityItem=>{
                        if(cityItem.pinyin==name){
                            resolve(cityItem);
                        }
                    });
                }
            });
        }catch(err){
            reject({
                name:'ERROR_DATA',
                message:'查找数据失败'
            });
        }
    })
}

citySchema.statics.cityHot=function(){
    return new Promise(async (resolve,reject)=>{
        try{
            const city=await this.findOne();
            resolve(city.data.hotCities);
        }catch(err){
            console.log(err);
            reject({
                name:'ERROR_DATA',
                message:'查找数据失败'
            });
        }
    })
}

citySchema.statics.cityGroup=function(){
    return new Promise(async (resolve,reject)=>{
        try{
            const city=await this.findOne();
            const cityObj=city.data;
            delete(cityObj._id);
            delete(cityObj.hotCities);
            resolve(cityObj)
        }catch(err){
            reject({
                name:'ERROR_DATA',
                message:'查找数据失败'
            });
        }
    })
}

citySchema.statics.getCityById=function(id){
    return new Promise(async (resolve,reject)=>{
        try{
            const city=await this.findOne();
            Object.entries(city.data).forEach(item=>{
                if(item[0]!= '_id' && item[0] != 'hotCities'){
                    item[1].forEach(cityItem=>{
                        if(cityItem.id == id){
                            resolve(cityItem);
                        }
                    });
                }
            })
        }catch(err){
            reject({
                name:'ERROR_DATA',
                message:'查找数据失败'
            });
        }
    })
}


const Cities=mongoose.model('Cities',citySchema);

Cities.findOne((err,data)=>{
    // console.log('in findOne');
    if(!data){
        Cities.create({data:cityData});
    }
})

export default Cities;
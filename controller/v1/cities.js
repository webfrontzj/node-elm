'use strict'

import Cities from '../../models/v1/cities'
import pinyin from 'pinyin'
import AddressComponent from '../../prototype/addressComponent'

class CityHandle extends AddressComponent{
    constructor(){
        super();
        this.getCity=this.getCity.bind(this);
        this.getExactAddress=this.getExactAddress.bind(this);
        this.pois=this.pois.bind(this);
    }
    async getCity(req,res,next){
        const type=req.query.type;
        let cityInfo;
        try{
            switch(type){
                case 'guess':
                    const city=await this.getCityName(req);
                    cityInfo=await Cities.cityGuess(city);
                    break;
                case 'hot':
                    cityInfo=await Cities.CityHot();
                    break;
                case 'group':
                    cityInfo=await Cities.cityGroup();
                    break;
                default:
                    res.json({
                        name:'ERROR_QUERY_TYPE',
                        message:'参数错误'
                    });
                    return;
            }
            res.send(cityInfo);
        }catch(err){
            res.send({
                name:'ERROR_DATA',
                message:'获取数据失败'
            });
        }
    }
    
}
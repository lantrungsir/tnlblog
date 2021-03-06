import axios from 'axios'

//must be edited

export const AxiosInstance = axios.create({
  baseURL : "http://localhost:2828",
  timeout: 30000,
  validateStatus : (status)=>{
    return status >= 200 && status < 300
  }
})


export const wrapPromise = (promise)=>{
  return promise
    .then(data=> ([data, null]))
    .catch(err=> ([null, err]))
}

export const asyncOperate =  async (...promises)=>{
  let results = [];
  for(let promise of promises){
    let promiseRet = await promise;
    results.push(promiseRet);
  }
  return results;
}
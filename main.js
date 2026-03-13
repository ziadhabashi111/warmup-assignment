const fs = require("fs");


//HELPERS
function timeToSeconds(timeStr) {
 let parts=timeStr.split(" ");
 let period=parts[1];
 let timeperiod=parts[0].split(':');
 let hours=parseInt(timeperiod[0]);
 let mins=parseInt(timeperiod[1]);
 let seconds=parseInt(timeperiod[2]);


 if (period === "pm" && hours !== 12) hours += 12;
 if (period === "am" && hours === 12) hours = 0;

 
    return (hours * 3600) + (mins * 60) + seconds;

}
function secondsTotime(totalseconds){
    let hours=Math.floor(totalseconds/3600);
    let remaining=totalseconds%3600;
    let minutes=Math.floor(remaining/60);
    let seconds=remaining%60;
    return hours + ":" +  String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}
function durationToseconds(dur){

    let parts=dur.split(":");

    return parseInt(parts[0]) *3600 + parseInt(parts[1]) *60 + parseInt(parts[2]);

}


// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    let startTimeSeconds=timeToSeconds(startTime);
     let endTimeSeconds=timeToSeconds(endTime);

     let duration=endTimeSeconds-startTimeSeconds;
     if (duration < 0) duration += 86400;
     return secondsTotime(duration);
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    let starttime=timeToSeconds(startTime);
    let endtime=timeToSeconds(endTime);

    let idlebefore=0;
    let idleafter=0;

    if(starttime<28800){
        idlebefore=28800-starttime;
    }
    if(endtime>79200){
        idleafter=endtime-79200;
    }

    return secondsTotime(idlebefore+idleafter);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    return secondsTotime(durationToseconds(shiftDuration)-durationToseconds(idleTime));
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    let parts=date.split("-");

    if(parseInt(parts[1])===4 && parseInt(parts[2])>=10 && parseInt(parts[2])<=30){
        if(durationToseconds(activeTime)>=21600){
            return true;
        }
    }else{
        if(durationToseconds(activeTime)>=30240){
            return true;
        }
    }
    return false;
  
    
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    let file=fs.readFileSync(textFile,"utf8");
    let lines=file.trim().split("\n");
      

    for(let i=0 ; i<lines.length;i++){
     let columns=lines[i].split(",");
        if(columns[0]===shiftObj.driverID && columns[2]===shiftObj.date){
          return {};
        
    }

    }
    let shiftDuration=getShiftDuration(shiftObj.startTime,shiftObj.endTime);
    let idleTime=getIdleTime(shiftObj.startTime, shiftObj.endTime);
    let activeTime=getActiveTime(shiftDuration,idleTime);
    let quota=metQuota(shiftObj.date, activeTime);

    let newRecord = {
    driverID: shiftObj.driverID,
    driverName: shiftObj.driverName,
    date: shiftObj.date,
    startTime: shiftObj.startTime,
    endTime: shiftObj.endTime,
    shiftDuration: shiftDuration,
    idleTime: idleTime,            
    activeTime: activeTime,         
    metQuota: quota,               
    hasBonus: false                
};
 let newLine = newRecord.driverID + "," + newRecord.driverName + "," + newRecord.date 
 + "," + newRecord.startTime + "," + newRecord.endTime + "," + newRecord.shiftDuration 
 + "," + newRecord.idleTime + "," + newRecord.activeTime + "," + newRecord.metQuota + "," 
 + newRecord.hasBonus;


  let lastIndex=-1;
  for(let i=0;i<lines.length;i++){
    let columns=lines[i].split(",");
    if(shiftObj.driverID===columns[0]){
        
        lastIndex=i;
    }
  }
  if(lastIndex===-1){
    lines.push(newLine);
  }else{
    lines.splice(lastIndex+1,0,newLine);
  }
  fs.writeFileSync(textFile, lines.join("\n"), "utf8");
return newRecord;
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
   let file=fs.readFileSync(textFile,"utf8");
   let lines=file.trim().split("\n")

   for(let i=0;i<lines.length;i++){
    let columns=lines[i].split(",");
    if(driverID===columns[0] && date===columns[1]){
        columns[9]=newValue;
         columns.join(',');
    }
   }
  
    fs.writeFileSync(textFile, lines.join("\n"), "utf8");

}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    let file=fs.readFileSync(textFile,"utf8");
    let lines=file.trim().split("\n");
    let count=0;
    let found=false;
    for(let i=0;i<lines.length;i++){
        let columns=lines[i].split(",");
        if(columns[0]===driverID){
            found=true;
        }
        if(driverID===columns[0] && parseInt(columns[2].split("-")[1])===parseInt(month)
            && columns[9]==="true"){
            count++;
        }
    }
 if(!found){
    return -1;
 }
 return count;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};

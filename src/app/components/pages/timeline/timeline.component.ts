import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { LanguageService } from 'src/app/services/language-service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CommonService } from 'src/app/services/common.service';
import { StudentScheduleService } from '../schedule/students-schedule.service';
import { AppService } from 'src/app/app.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import * as crypto from 'crypto-js';

function autocompleteObjectValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (typeof control.value === 'string') {
      return { 'invalidAutocompleteObject': { value: control.value } }
    }
    return null  /* valid option selected */
  }
}


@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {

  nricNumberData: any;
  passportNumberData: any;
  tranNumberData: any;
  licenseTypeData:any;

  translateVal;
  statusDone;
  enrollment_no = new FormControl('', { validators: [autocompleteObjectValidator()] });
  license_type= new FormControl('', { validators: [autocompleteObjectValidator()] });

  enId: any;
  status_id: number;
  LicenseData: any;
  statusDetail: any;

  dialogRef: MatDialogRef<any>;
  licenseinfo: any;
  package_name: any;
  nextStatus: any;
  instructorInfo: any;
  timeArray: any[];
  showLicense: boolean=false;
  statusDoneList: any;

  constructor(private fb: FormBuilder,
    private languageService: LanguageService, private timelineService: CommonService,
    public calendarService: StudentScheduleService,
    private modalService: NgbModal,public dialog: MatDialog,private router:Router,
    private appService: AppService,) {

  }

  nric_number = new FormControl('', { validators: [autocompleteObjectValidator()] });
  passport_number = new FormControl('', { validators: [autocompleteObjectValidator()] });
  registration_no = new FormControl('', { validators: [autocompleteObjectValidator()] });


  nricNumberList: Observable<string[]>;
  passportNumberList: Observable<string[]>;
  tranNumberList: Observable<string[]>;
  licenseTypeList: Observable<string[]>;

  marks: string;
  remark: string;
  statusList: any;
  statusUpdateForm: FormGroup;



  ngOnInit(): void {
    this.languageService.languageChanged.subscribe(() => {
      this.translateVal = (localStorage.lang == 'ml' ? 'malay' : 'english');
    });
    this.selectedNricNumber();
    this.statusUpdateForm = this.fb.group({
      status: [''],
      result: [''],
      remarks: [''],
      marks:[''],
      rating:['']
    });
    this.getTimeDetails();
  }

  getStatusList() {
    this.timelineService.getStatusList()
      .subscribe(res => {
        this.statusList = res;
      })
  }
  displayFnTransactionNumber(user): string {
    console.log("user===", user)
    return user && user.enrollment_no ? user.enrollment_no : '';
  }
  public validation_msgs = {
    'nric_number': [
      { type: 'invalidAutocompleteObject', message: 'NRIC Number not recognized. Click one of the options.' }
    ],
    'passport_number': [
      { type: 'invalidAutocompleteObject', message: 'Passport Number not recognized. Click one of the options.' }
    ],
    'enrollment_no': [
      { type: 'invalidAutocompleteObject', message: 'Transaction Number not recognized. Click one of the options.' }
    ],
    'license_type': [
      { type: 'invalidAutocompleteObject', message: 'License Class not recognized. Click one of the options.' }
    ]
  }

  // -------------------------------------to get Enroll Number list------------------

  selectedNricNumber() {
    this.calendarService.getEnrollmentNumberForSchedule()
      .subscribe((res) => {
        this.tranNumberData = res['enrollData'];
        this.tranNumberList = this.enrollment_no.valueChanges.pipe(
          startWith(''),
          map(value => (typeof value === 'string' ? value : value.enrollment_no)),
          map(name => (name ? this._filterTranNumber(name) : this.tranNumberData.slice())),
        );
      })

  }
  private _filterTranNumber(name: string): [] {
    const filterValue = name.toLowerCase();
    return this.tranNumberData.filter(option => option.enrollment_no.toLowerCase().includes(filterValue));
  }

  editPackageDetails(){
    this.timelineService.showSnackBar("To Change the Package, Please contact clerk!!")
    // this.timelineService.setPackageInfoToEdit(this.licenseinfo);
    // this.router.navigate(['/clerk/apply/update-package']);
  }

   // -------------------------------------------on Change enrollment no-----------------

   getLicenseListPerEnroll(event){
    console.log("----------",this.enrollment_no.value);
    this.timelineService.showLoader(true);
    this.showLicense=false;
    this.LicenseData=[];
    this.statusList=[];
    this.license_type.patchValue({});
    this.timelineService.getLicenseListPerEnroll(this.enrollment_no.value.student_id,event.option.value.id)
      .subscribe((res)=>{
        this.showLicense=true;
        this.timelineService.showLoader(false);
        if(res['status'] == 'Success'){
          if(res['licenseData'].length > 0){
            this.licenseTypeData=res['licenseData'];
            this.licenseTypeList = this.license_type.valueChanges.pipe(
              startWith(''),
              map(value => (typeof value === 'string' ? value : value.enrollment_no)),
              map(name => (name ? this._filterLicenseClass(name) : this.licenseTypeData.slice())),
            );
            if(res['licenseData'].length == 1){
              this.license_type.patchValue(res['licenseData'][0]);
              this.loadTimeline(res['licenseData'][0]);
            }
          }else{
            this.showLicense=false;
            this.timelineService.showSnackBar("No License Class Available")
          }
      }
     
    })
  }

  displayFnLicenseClass(user): string {
    console.log("user===",user)
    return user && user.license_class ? user.license_class : '';
  }

  private _filterLicenseClass(name: string): [] {
    const filterValue = name.toLowerCase();
    return this.licenseTypeData.filter(option => option.license_type.toLowerCase().includes(filterValue));
  }

  isToday(someDate) {
    const today = new Date()
    return someDate.getDate() == today.getDate() &&
      someDate.getMonth() == today.getMonth() &&
      someDate.getFullYear() == today.getFullYear()
  }

  
  checkStudentTimeLine(event) {
    this.timelineService.showLoader(true);
    console.log("====",);
    this.loadTimeline(event.option.value);
  }

  loadTimeline(enrollValue){
    this.LicenseData=[];
    this.statusList=[];
    this.nextStatus={};
    this.statusDoneList=[];
    if(enrollValue){
      this.timelineService.getStatusListForTimeLine(enrollValue)
      .subscribe(res=>{
        this.statusList=res['statusData'];
        this.nextStatus=res['nextStatus'][0];
        console.log("nextStatus==========",this.nextStatus)
        this.timelineService.checkTimelineForStudent(enrollValue)
        .subscribe((res)=>{
          this.timelineService.showLoader(false);
          console.log("res--===-----",res);
          this.statusDone = res['timelineData'];
          this.licenseinfo=res['LicenseData'];
          this.package_name=this.licenseinfo[0]['package_'+this.translateVal];
          this.LicenseData=this.licenseinfo[0].license_class;
         for(let z=0;z<this.statusDone.length;z++){
           this.statusDoneList.push(this.statusDone[z].status_id)
         }
          console.log("LicenseData-----",this.LicenseData)
          if(enrollValue.license_process == 'PDL'){
            for(let i=0;i<this.statusList.length; i++){
              this.statusList[0]['BColor']='timeline-green';
              this.statusList[0]['completed_date']=res['timelineData'][0].cur_date;
              for(let j=0;j<this.statusDone.length;j++){
                if(this.statusList[i].id == this.statusDone[j].status_id){
                  this.statusList[i].showStatus=true;
                  if(this.statusList[i].test_flag == 'R' && this.licenseinfo[0].result == 'Fail' && this.statusList[i].id == this.licenseinfo[0].status_id){
                    this.statusList[i]['BColor']='';
                  }else{
                    this.statusList[i]['BColor']='timeline-green';
                  }
                  this.statusList[i].marks=this.statusDone[j].marks;
                  this.statusList[i].rating=this.statusDone[j].rating;
                  // this.statusList[i]['scheduled_date']=this.statusDone[j].scheduled_date;
                  this.statusList[i]['completed_date']=this.statusDone[j].completed_date;
                  if(this.statusDone[j].payInfo.length > 0){
                    this.statusList[i].showReceipt=true;
                    this.statusList[i].payInfo=this.statusDone[j].payInfo[0]
                  }else{
                    this.statusList[i].showReceipt=false;
                  }
                }else{
                  if((this.statusList[i].id == 16 || this.statusList[i].id == 17 || this.statusList[i].id == 18) && !this.statusDoneList.includes(this.statusList[i].id)){
                    this.statusList[i].showStatus=false;
                  }else
                  if(this.statusList[i].test_flag == 'R' && !this.statusDoneList.includes(this.statusList[i].id)){
                    if(this.licenseinfo[0].result == 'Fail' && (Number(this.licenseinfo[0].status_id)+1 == this.statusList[i].id)){
                      this.statusList[i].showStatus=true;
                    }else{
                       this.statusList[i].showStatus=false;
                    }
                  }else{
                    this.statusList[i].showStatus=true;
                  }
                }
              }
            }
          }else{
            for(let i=0;i<this.statusList.length; i++){
              for(let j=0;j<this.statusDone.length;j++){
                if(this.statusList[i].id == this.statusDone[j].status_id){
                  this.statusList[i].showStatus=true;
                  if(this.statusList[i].test_flag == 'R' && this.licenseinfo[0].result == 'Fail' && this.statusList[i].id == this.licenseinfo[0].status_id){
                    this.statusList[i]['BColor']='';
                  }else{
                    this.statusList[i]['BColor']='timeline-green';
                  }
                  // this.statusList[i]['scheduled_date']=this.statusDone[j].scheduled_date;
                  this.statusList[i].marks=this.statusDone[j].marks;
                  this.statusList[i].rating=this.statusDone[j].rating;
                  this.statusList[i]['completed_date']=this.statusDone[j].completed_date;
                  if(this.statusDone[j].payInfo.length > 0){
                    this.statusList[i].showReceipt=true;
                  }else{
                    this.statusList[i].showReceipt=false;
                  }
                }else{
                  if((this.statusList[i].id == 16 || this.statusList[i].id == 17 || this.statusList[i].id == 18) && !this.statusDoneList.includes(this.statusList[i].id)){
                    this.statusList[i].showStatus=false;
                  }else
                  if(this.statusList[i].test_flag == 'R' && !this.statusDoneList.includes(this.statusList[i].id)){
                    if(this.licenseinfo[0].result == 'Fail' && (Number(this.licenseinfo[0].status_id)+1 == this.statusList[i].id)){
                      this.statusList[i].showStatus=true;
                    }else{
                       this.statusList[i].showStatus=false;
                    }
                  }else{
                    this.statusList[i].showStatus=true;
                  }
                }
              }
            }
          }
         
          console.log("this.statusList====",this.statusList)
        })
      })
    }
  }

  updateStatus(statusdt,deleteRecord) {
    var curDate=new Date();
    console.log("======",statusdt,curDate , new Date(statusdt.scheduled_date));
    // let today=this.isToday(statusdt.scheduled_date);
    this.statusUpdateForm.patchValue({
      remarks:'',
      marks:'',
      result:''
    })
    if(this.license_type.value.license_process == 'PDL'){
        this.timelineService.getStatusListForStudent(this.license_type.value)
        .subscribe(res => {
          let expiryData=res['expiryData'];
          console.log("getStatusListForStudent===",statusdt.id,expiryData,res['data'])
          if(res['data'].length>0){
            if (statusdt.id == res['data'][0].id) {
              if(res['data'][0].id == 7){
                if(expiryData[0].LDL_license_no != null){
                  this.status_id=res['data'][0].id;
                  this.statusDetail=res['data'][0];
                  this.statusUpdateForm.patchValue({
                    'status':res['data'][0].status
                  })
                  this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                }else{
                  this.timelineService.showSnackBar("LDL License is in Process..")
                }
              }else if(res['data'][0].id == 15){
                if(expiryData[0].PDL_license_no != null){
                  this.status_id=res['data'][0].id;
                  this.statusDetail=res['data'][0];
                  this.statusUpdateForm.patchValue({
                    'status':res['data'][0].status
                  })
                  this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                }else{
                  this.timelineService.showSnackBar("PDL License is in Process..")
                }
              }else if(res['data'][0].id == 26){
                if(expiryData[0].GDL_license_no != null){
                  this.status_id=res['data'][0].id;
                  this.statusDetail=res['data'][0];
                  this.statusUpdateForm.patchValue({
                    'status':res['data'][0].status
                  })
                  this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                }else{
                  this.timelineService.showSnackBar("GDL License is in Process..")
                }
              }else if(res['data'][0].id == 34){
                if(expiryData[0].PSV_license_no != null){
                  this.status_id=res['data'][0].id;
                  this.statusDetail=res['data'][0];
                  this.statusUpdateForm.patchValue({
                    'status':res['data'][0].status
                  })
                  this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                }else{
                  this.timelineService.showSnackBar("PSV License is in Process..")
                }
              }else{
                this.status_id=res['data'][0].id;
                this.statusDetail=res['data'][0];
                this.statusUpdateForm.patchValue({
                  'status':res['data'][0].status
                })
                console.log("res['scheduleDt']---",res['scheduleDt'])
                // if(res['scheduleDt'].length > 0){ //enable check once
                //   console.log("curDate >= new Date(res['scheduleDt'][0].scheduled_date)=====",res['scheduleDt'][0].schedule_date,curDate ,'====================', new Date(res['scheduleDt'][0].scheduled_date), curDate >= new Date(res['scheduleDt'][0].scheduled_date))
                //   if(curDate >= new Date(res['scheduleDt'][0].scheduled_date)){
                //     this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                //   }else{
                //     this.timelineService.showSnackBar("Not Applicable")
                //   }
                // }else{
                //   this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                // }
                this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' }); //---comment while enable above
                
              }
            }else{
              this.timelineService.showSnackBar("Not Applicable")
            }
          }else{
            this.timelineService.showSnackBar("Not Applicable")
          }
        })
      }else{
        this.timelineService.getStatusListForStudentOfGDL(this.license_type.value)
        .subscribe(res => {
          let expiryData=res['expiryData'];
          console.log("getStatusListForStudent===",statusdt.id,expiryData,res['data'])
          if(res['data'].length>0){
            if (statusdt.id == res['data'][0].id) {
              if(res['data'][0].id == 7){
                if(expiryData[0].LDL_license_no != null){
                  this.status_id=res['data'][0].id;
                  this.statusDetail=res['data'][0];
                  this.statusUpdateForm.patchValue({
                    'status':res['data'][0].status
                  })
                  this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                }else{
                  this.timelineService.showSnackBar("LDL License is in Process..")
                }
              }else if(res['data'][0].id == 15){
                if(expiryData[0].PDL_license_no != null){
                  this.status_id=res['data'][0].id;
                  this.statusDetail=res['data'][0];
                  this.statusUpdateForm.patchValue({
                    'status':res['data'][0].status
                  })
                  this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                }else{
                  this.timelineService.showSnackBar("PDL License is in Process..")
                }
              }else if(res['data'][0].id == 26){
                if(expiryData[0].GDL_license_no != null){
                  this.status_id=res['data'][0].id;
                  this.statusDetail=res['data'][0];
                  this.statusUpdateForm.patchValue({
                    'status':res['data'][0].status
                  })
                  this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                }else{
                  this.timelineService.showSnackBar("GDL License is in Process..")
                }
              }else if(res['data'][0].id == 34){
                if(expiryData[0].PSV_license_no != null){
                  this.status_id=res['data'][0].id;
                  this.statusDetail=res['data'][0];
                  this.statusUpdateForm.patchValue({
                    'status':res['data'][0].status
                  })
                  this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                }else{
                  this.timelineService.showSnackBar("PSV License is in Process..")
                }
              }else{
                this.status_id=res['data'][0].id;
                this.statusDetail=res['data'][0];
                this.statusUpdateForm.patchValue({
                  'status':res['data'][0].status
                })
                 // if(res['scheduleDt'].length > 0){ //enable check once
                //   console.log("curDate >= new Date(res['scheduleDt'][0].scheduled_date)=====",res['scheduleDt'][0].schedule_date,curDate ,'====================', new Date(res['scheduleDt'][0].scheduled_date), curDate >= new Date(res['scheduleDt'][0].scheduled_date))
                //   if(curDate >= new Date(res['scheduleDt'][0].scheduled_date)){
                //     this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                //   }else{
                //     this.timelineService.showSnackBar("Not Applicable")
                //   }
                // }else{
                //   this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' });
                // }
                this.modalService.open(deleteRecord, { ariaLabelledBy: 'modal-basic-title' }); //comment on enabling above
              }
            }else{
              this.timelineService.showSnackBar("Not Applicable")
            }
          }else{
            this.timelineService.showSnackBar("Not Applicable")
          }
        })
      }
    
  }

  viewInstructorDetails(id: number,instructorData) {
    this.timelineService.viewInstructorDetails(this.license_type.value,id)
    .subscribe(res=>{
      if(res['insData'].length > 0){    
        this.instructorInfo=res['insData'];
        for(let i=0;i<this.instructorInfo.length;i++){
          for(let j=0;j<this.timeArray.length;j++){
            let timeSlotDt=this.zeroPad(this.instructorInfo[i].TimeSlot,this.timeArray.length);
              if(timeSlotDt[j] == 1){
                this.instructorInfo[i].schedule_time=this.timeArray[j].range;
                break;
              }
            }
        }
        console.log("this.instructorInfo==========",this.instructorInfo)
        this.modalService.open(instructorData, { ariaLabelledBy: 'modal-basic-title',size:'lg' });
      }else{
        this.timelineService.showSnackBar("No Details Available!!")
      }
    })
  }

  makePayment(statusDt){
    this.timelineService.getStudentInfo().subscribe(res=>{
      console.log("stud========",res,this.licenseinfo[0])
      let amountToPay= (this.licenseinfo[0].payment_phase == 1 ? this.licenseinfo[0].final_price : this.licenseinfo[0].first_phase_price);
      var enroll_no=this.enrollment_no.value.enrollment_no +'_'+this.license_type.value.license_id;
      this.pay_senangpay(res.name,res.email_id,res.mobile_number,amountToPay,this.licenseinfo[0].package_english,enroll_no,'');
    })
}



  showPaymentReceipt(statusdt){
    console.log("statusdt----",statusdt);
    this.timelineService.getStudentInfo().subscribe(res=>{
      this.dialogRef = this.dialog.open(ConfirmDialogComponent);
      this.dialogRef.componentInstance.data = res;
      this.dialogRef.componentInstance.packDt = this.licenseinfo[0]
      this.dialogRef.componentInstance.licenseData = this.LicenseData;
      this.dialogRef.componentInstance.payInfo = statusdt.payInfo;
      this.dialogRef.componentInstance.enrollment_no=this.enrollment_no.value.enrollment_no
    })
  }

  redirectSchedule(statusdt){
    console.log("statusdt====",this.enrollment_no.value);
    this.calendarService.setScheduleRedirect(this.license_type.value)
    this.router.navigate(['/schedule-list'])
  }


  updateStudentStatusInfo() {
    let statusdt = {
      status_id: this.status_id,
      remarks: this.statusUpdateForm.value.remarks,
      marks: this.statusUpdateForm.value.marks,
      result: this.statusUpdateForm.value.result,
      rating:this.statusUpdateForm.value.rating
    }
    this.timelineService.updateStudentStatusInfo(this.license_type.value, statusdt)
      .subscribe(() => {
        this.timelineService.showSnackBar("Updated Successfully!!!");
        this.loadTimeline(this.license_type.value);
      })
  }

  zeroPad(num,total) {
    return num.toString().padStart(Number(total), "0");
  }

  getTimeDetails(){
    this.calendarService.getTimeDetails()
    .subscribe((res)=>{
        let resObj=res['data'][0];
        this.makeTimeIntervals((resObj.working_hour_from).substr(0, 5),(resObj.working_hour_to).substr(0, 5),60,(resObj.rest_hour_from).substr(0, 5),(resObj.rest_hour_to).substr(0, 5))
    })
  }

  makeTimeIntervals (startTime, endTime, increment, restStart, restEnd){
    startTime = startTime.toString().split(':');
    endTime = endTime.toString().split(':');
    increment = parseInt(increment, 10);

    var pad = function (n) { return (n < 10) ? '0' + n.toString() : n; },
        startHr = parseInt(startTime[0], 10),
        startMin = parseInt(startTime[1], 10),
        endHr = parseInt(endTime[0], 10),
        endMin = parseInt(endTime[1], 10),
        currentHr = startHr,
        currentMin = startMin,
        previous = currentHr + ':' + pad(currentMin),
        current = '',
        r = [];

      do {
          currentMin += increment;
          if ((currentMin % 60) === 0 || currentMin > 60) {
              currentMin = (currentMin === 60) ? 0 : currentMin - 60;
              currentHr += 1;
          }
          current = currentHr + ':' + pad(currentMin);
          r.push({'range':previous + ' - ' + current,'checkValue':0,employeeList:[]});
          previous = current;
    } while (currentHr !== endHr);
        var restTime=restStart+' - '+ restEnd;
        this.timeArray=r.filter((el)=>{return el.range != restTime});
    };

    pay_senangpay(name,email,phone,amount,type,order_id,institution){
      let merchant_id = this.appService.getConfig('merchantId');
      let secretkey = this.appService.getConfig('secretKey');
      var url = this.appService.getConfig('payUrl'); 
      console.log("merchattttt=======",merchant_id,secretkey);
       var hash = crypto.HmacSHA256(secretkey.concat(type,amount,order_id), secretkey);
           console.log("url----",url);
       var ccForm = '<form action="' + url + '" id="customerData" method="post" name="customerData"><input name="detail" value="' + type + '" /><input name="amount" value="' + amount + '" /><input name="order_id" value="' + order_id + '" /><input name="name" value="' + name + '" /><input name="email" value="' + email + '" /><input name="phone" value="' + phone + '" /><input name="hash" value="' + hash + '" /></form>'
       document.getElementById('CCDataForm').innerHTML = ccForm;
       (document.getElementById('customerData') as HTMLFormElement).submit();
     }

}

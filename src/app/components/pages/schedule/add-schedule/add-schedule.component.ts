import { Component, ViewChild, OnInit } from '@angular/core';
import {
  CalendarOptions,
  EventClickArg,
  EventApi,
} from '@fullcalendar/angular';
import { NavigationExtras, Router, ActivatedRoute } from '@angular/router';
import { Observable, map, startWith, debounceTime, switchMap, of } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';
import { EventInput } from '@fullcalendar/angular';
import { MatDialog } from '@angular/material/dialog';
import { StudentScheduleService } from '../students-schedule.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { FormDialogComponent } from '../dialogs/form-dialog/form-dialog.component';
import { Calendar } from '../students-schedule.model';
import { UnsubscribeOnDestroyAdapter } from 'src/app/shared/UnsubscribeOnDestroyAdapter';
import { AppService } from 'src/app/app.service';
import { CommonService } from 'src/app/services/common.service';
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
  selector: 'app-add-schedule',
  templateUrl: './add-schedule.component.html',
  styleUrls: ['./add-schedule.component.scss']
})
export class AddScheduleComponent extends UnsubscribeOnDestroyAdapter implements OnInit {

  @ViewChild('calendar', { static: false })
  calendar: Calendar | null;
  public addCusForm: FormGroup;
  scheduleList;

  dialogTitle: string;
  filterOptions = 'All';
  calendarData = [];
  filterItems = []

  calendarEvents: EventInput[];
  tempEvents: EventInput[];
  tranNumberData: any;

  nricNumberData: any;
  passportNumberData: any;
  handler: any;
  licenseTypeData:any;


  translateVal=(localStorage.lang == 'ml' ? 'malay' : 'english');
  nric_number = new FormControl('', { validators: [autocompleteObjectValidator()] });
  passport_number = new FormControl('', { validators: [autocompleteObjectValidator()] });
  enrollment_no = new FormControl('', { validators: [autocompleteObjectValidator()] });
  license_type= new FormControl('', { validators: [autocompleteObjectValidator()] });

  nricNumberList: Observable<string[]>;
  passportNumberList: Observable<string[]>;
  tranNumberList: Observable<string[]>;
  licenseTypeList: Observable<string[]>;

  enrollDetails: any;
  authToken: string;
  apiToken: string;
  SchData: any;
  amountToPay: any;
  showPaymentBtn: boolean=false;
  upcomingStatus: any;
  scheduleStatus: string;
  licenseinfo: any;
  LicenseData: any=[];
  waitingLicense: string;
  studentInfo: any;
  timeArray: any[];
  scheduleMessage: string;
  showLicense: boolean=false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public calendarService: StudentScheduleService,
    private snackBar: MatSnackBar,
    private appService: AppService,
    private commonService: CommonService,
    private route:ActivatedRoute
  ) {
    super();
    this.dialogTitle = 'Add New Event';
    this.calendar = new Calendar({});
    this.addCusForm = this.createCalendarForm(this.calendar);

    this.authToken = sessionStorage.getItem("authToken");
    this.apiToken = this.appService.getConfig('apiToken')
  }

  public ngOnInit(): void {
    this.authToken = sessionStorage.getItem("authToken");
    this.apiToken = this.appService.getConfig('apiToken')
    this.selectedNricNumber();
    this.getStudentInfo(); 
    this.getTimeDetails();
    this.LicenseData=[];
    this.calendarData=[];
    this.calendarService.getScheduleRedirect()
      let scheduledt= this.calendarService.getScheduleRedirect();
      console.log("scheduledt=====",scheduledt);
      if(scheduledt){
        this.calendarData=[];
        this.calendarService.getParticularEnroll(scheduledt)
        .subscribe(res=>{
          this.showLicense=true;
          this.enrollment_no.patchValue(res['enrollData'][0]);
          this.getLicenseListPerEnroll();
          this.license_type.patchValue(res['licenseData'][0]);
          this.showSchedule(res['licenseData'][0]);
        })
        
      }
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

  displayFnTransactionNumber(user): string {
    console.log("user===", user)
    return user && user.enrollment_no ? user.enrollment_no : '';
  }

  displayFnLicenseClass(user): string {
    console.log("user===",user)
    return user && user.license_class ? user.license_class : '';
  }


  private _filterTranNumber(name: string): [] {
    const filterValue = name.toLowerCase();
    return this.tranNumberData.filter(option => option.enrollment_no.toLowerCase().includes(filterValue));
  }

  private _filterLicenseClass(name: string): [] {
    const filterValue = name.toLowerCase();
    return this.licenseTypeData.filter(option => option.license_type.toLowerCase().includes(filterValue));
  }

  calendarOptions: CalendarOptions = {
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
    initialView: 'dayGridMonth',
    displayEventTime: false,
    weekends: true,
    editable: true,
    // selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    // select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
  };


  changeCategory(event: MatCheckboxChange, filter) {
    if (event.checked) {
      this.filterItems.push(filter.status);
    } else {
      this.filterItems.splice(this.filterItems.indexOf(filter.status), 1);
    }
    this.filterEvent(this.filterItems);
  }

  getStudentInfo(){
    this.commonService.getStudentInfo().subscribe(res => {
      if (res) {
        this.studentInfo = res;
        console.log("----------",this.studentInfo)

      }
    })
  }

  filterEvent(element) {
    const list = this.calendarEvents.filter((x) =>
      element.map((y) => y).includes(x.title)
    );

    this.calendarOptions.events = list;
  }

  handleEventClick(clickInfo: EventClickArg) {
    this.eventClick(clickInfo);
  }

  eventClick(row) {
    console.log("row.event-------eve---",row.event)
    const calendarData: any = {
      id: row.event.id,
      title: row.event.title,
      lead_time: row.event._def.extendedProps.lead_time,
      statusid: row.event._def.extendedProps.statusid,
      schedule_name: row.event._def.extendedProps.schedule_name,
      schedule_view: row.event._def.extendedProps.schedule_view,
      schedule_view_assignment: row.event._def.extendedProps.employeeName,
      startDate: row.event.start,
      endDate: row.event.end,
      enrollData: this.enrollDetails
    };

    let tempDirection;
    if (localStorage.getItem('isRtl') === 'true') {
      tempDirection = 'rtl';
    } else {
      tempDirection = 'ltr';
    }
    this.getTimeDetails();
    const dialogRef = this.dialog.open(FormDialogComponent, {
      data: {
        calendar: calendarData,
        timeData:this.timeArray,
        action: 'edit',
      },
      direction: tempDirection,
    });

    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {
      if (result === 'submit') {
        // this.getScheduleDetails();
        this.addCusForm.reset();
      } else if (result === 'delete') {
        // this.getScheduleDetails();
      }
    });
  }

  editEvent(eventIndex, calendarData) {
    const calendarEvents = this.calendarEvents.slice();
    const singleEvent = Object.assign({}, calendarEvents[eventIndex]);
    singleEvent.id = calendarData.id;
    singleEvent.title = calendarData.title;
    singleEvent.start = calendarData.startDate;
    singleEvent.end = calendarData.endDate;
    singleEvent.className = '';
    singleEvent.groupId = calendarData.category;
    singleEvent.details = calendarData.details;
    calendarEvents[eventIndex] = singleEvent;
    this.calendarEvents = calendarEvents; // reassign the array

    this.calendarOptions.events = calendarEvents;
  }

  handleEvents(events: EventApi[]) {
    // this.currentEvents = events;
  }

  createCalendarForm(calendar): FormGroup {
    return this.fb.group({
      id: [calendar.id],
      lead_time: [
        calendar.lead_time,
        [Validators.required, Validators.pattern('[a-zA-Z]+([a-zA-Z ]+)*')],
      ],
      schedule_name: [calendar.schedule_name],
      schedule_view: [calendar.schedule_view],
      startDate: [calendar.startDate, [Validators.required]],
      endDate: [calendar.endDate, [Validators.required]],
    });
  }

  showNotification(colorName, text, placementFrom, placementAlign) {
    this.snackBar.open(text, '', {
      duration: 2000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }

// ---------------------------------------get Enrollment Number list--------------------------

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

  // -------------------------------------------on Change enrollment no-----------------

  getLicenseListPerEnroll(){
    console.log("----------",this.enrollment_no.value);
    this.commonService.showLoader(true);
    this.enrollDetails=[]; 
    this.showLicense=false;
    this.scheduleStatus='';
    this.LicenseData=[];
    this.calendarData=[];
    this.license_type.patchValue({});
    this.calendarService.getLicenseListPerEnroll(this.enrollment_no.value.student_id,this.enrollment_no.value.id)
      .subscribe((res)=>{
        this.showLicense=true;
        this.commonService.showLoader(false);
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
              this.checkPaymentInfo()
            }
          }else{
            this.showLicense=false;
            this.commonService.showSnackBar("No License Class Available")
          }
      }
     
    })
  }

  checkPaymentInfo() {
    if(this.license_type.value.status_id == 2){
      this.commonService.showSnackBar("Please make Initial Payment!!")
    }else{
      this.showSchedule(this.license_type.value)
    }
  }

  showSchedule(enrollValue){
    console.log("enrollValue=================",enrollValue)
    this.showPaymentBtn=false;
    this.SchData=enrollValue;
    this.SchData.enrollment_no=this.enrollment_no.value.enrollment_no +'_'+ this.license_type.value.license_id;
    this.LicenseData=[];
    this.calendarData=[];
    this.waitingLicense='';
    console.log("event.option.value---===========getStudentSchedule==========--", enrollValue);
    this.commonService.showLoader(true);
    if(enrollValue.license_process == 'PDL'){
      this.calendarService.checkPaymentDone(this.SchData).subscribe(res => {
        this.licenseinfo=res['LicenseData'];
        this.amountToPay=res.amountToBePaid;
        this.upcomingStatus=res['nextStatus'][0];
        for(let i=0;i<this.licenseinfo.length;i++){
          this.licenseinfo[i].package_name=this.licenseinfo[i]['package_'+this.translateVal];
          this.licenseinfo[i].package_description=this.licenseinfo[i]['package_desc_'+this.translateVal];
          this.LicenseData.push(this.licenseinfo[i].license_class)
        }
        if(res['status'] == 'Success'){
          this.showPaymentBtn=false;
          if(this.upcomingStatus.id == 7 || this.upcomingStatus.id == 15){
            this.scheduleStatus="Waiting";
            this.waitingLicense=(this.upcomingStatus.id == 7 ? 'LDL' : 'PDL')
          }else{
            this.scheduleStatus='Success';
            this.getScheduleInfo(this.SchData);
          }
        }else if(res['status'] == 'Pay'){
            this.scheduleStatus='Pay';
            this.showPaymentBtn=true;
        }else if(res['status'] == "Pay Not Found"){
          this.commonService.showSnackBar("Retest Amount is not defined!!!")
        }else if(res['status'] == 'Completed'){
          this.commonService.showSnackBar("Process Completed!!!")
        }
        
      }, error => { }, () => { this.commonService.showLoader(false) });
  }else{
    this.calendarService.checkPaymentDoneForGDLProcess(this.SchData)
        .subscribe((res)=>{
          console.log("res----------",res);
              this.licenseinfo=res['LicenseData'];
              this.amountToPay=res['amountToBePaid'];
              this.upcomingStatus=res['nextStatus'][0];
              console.log("licenseinfo-------------",this.licenseinfo);
              for(let i=0;i<this.licenseinfo.length;i++){
                this.licenseinfo[i].package_name=this.licenseinfo[i]['package_'+this.translateVal];
                this.licenseinfo[i].package_description=this.licenseinfo[i]['package_desc_'+this.translateVal];
                this.LicenseData.push(this.licenseinfo[i].license_class)
              }
              if(res['status'] == 'Success'){
                if(this.upcomingStatus.id == 26 || this.upcomingStatus.id == 34){
                    this.scheduleStatus="Waiting";
                    this.waitingLicense=enrollValue.license_process;
                }else{
                  this.scheduleStatus='Success';
                  this.getScheduleInfo(this.SchData);
                }
              }else if(res['status'] == 'Pay'){
                  this.scheduleStatus='Pay';
              }else if(res['status'] == "Pay Not Found"){
                this.commonService.showSnackBar("Retest Amount is not defined!!!")
              }else if(res['status'] == 'Completed'){
                  this.commonService.showSnackBar("Process Completed!!!")
              }
        })
  }
  }

  
  receipt() {
    console.log("----------",this.studentInfo)
    this.pay_senangpay(this.studentInfo.name,this.studentInfo.email_id,this.studentInfo.mobile_number,this.amountToPay,this.licenseinfo[0].package_english,this.SchData.enrollment_no,'');
  }
 
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

  getScheduleInfo(schData) {
    console.log("schData-=----------",schData)
    this.calendarService.getSchedulePerEnroll(schData,this.upcomingStatus.id,this.license_type.value)
      .subscribe((res) => {
        this.calendarData = [];
        this.enrollDetails = schData;
        console.log("res['status']---------------",res['status'])
        if(res['scheduleList'].length >0){
          for (let i = 0; i < res['scheduleList'].length; i++) {
            this.calendarData.push({
              title: res['scheduleList'][i].status,
              start: new Date(res['scheduleList'][i].startDate),
              end: new Date(res['scheduleList'][i].endDate),
              className: (res['status'] == 'New' ? res['scheduleList'][i].schedule_color : 'fc-event-success'),
              backgroundColor:(res['status'] == 'New' ? res['scheduleList'][i].schedule_color : 'green'),
              id: res['scheduleList'][i].id,
              statusid: res['scheduleList'][i].status_id,
              schedule_name: res['scheduleList'][i].status,
              schedule_view: res['scheduleList'][i].schedule_view,
              assignment: res['scheduleList'][i].AssignmentList,
              startDate: new Date(res['scheduleList'][i].startDate),
              endDate: new Date(res['scheduleList'][i].endDate),
              employeeName: res['scheduleList'][i].employee_name,
              schedule_status:res['status']
            })
          }
          this.calendarEvents = this.calendarData;
          this.tempEvents = this.calendarEvents;
          this.calendarOptions.events = this.calendarEvents;
        }else{
          if(res['status'] == 'New'){
            this.scheduleMessage="No Schedule Found"
          }else{
            this.scheduleMessage="Our Clerk will schedule your "+this.upcomingStatus.status+ " and SMS/Email will be sent to your registered Medium.In the meantime,please select Timeline to view the progress."
          }

        }
     
      }, error => { }, () => { this.commonService.showLoader(false) });
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

}






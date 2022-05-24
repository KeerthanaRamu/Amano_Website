import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Calendar } from "./students-schedule.model";
import { Observable } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { map } from 'rxjs/operators';
import { AppService } from "src/app/app.service";

@Injectable({
  providedIn: 'root',
})
export class StudentScheduleService {

  private readonly API_URL = "assets/data/calendar.json";
  httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": "application/json",
    }),
  };
  dataChange: BehaviorSubject<Calendar[]> = new BehaviorSubject<Calendar[]>([]);
  // Temporarily stores data from dialogs
  dialogData: any;
  apiUrl: string;
  enrollData: any;
  constructor(private appService: AppService,private http: HttpClient ) {
    this.apiUrl= this.appService.getConfig('apiUrl');
  }
  get data(): Calendar[] {
    return this.dataChange.value;
  }
  getDialogData() {
    return this.dialogData;
  }
  getAllCalendars(): Observable<Calendar[]> {
    return this.http
      .get<Calendar[]>(this.API_URL)
      .pipe(catchError(this.errorHandler));
  }


  deleteCalendar(calendar: Calendar): void {
    this.dialogData = calendar;
  }
  errorHandler(error) {
    let errorMessage = "";
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.log(errorMessage);
    return throwError(errorMessage);
  }


  setScheduleRedirect(enrollvalue){
    this.enrollData=enrollvalue;
  }

  getScheduleRedirect(){
    return this.enrollData;
  }
  

  getTimeDetails(){
    return this.http
      .get<any>(`${this.apiUrl}onlineCustomer/getOverallTimeDetails`)
      .pipe(
        map((res) => {
          return res;
        })
      );
  }
  
  getSelectedScheduleInfoStudent(calendarInfo,enrollData){
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/getSelectedScheduleInfoStudent`,{calendarInfo,enrollData})
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

 

  getLicenseListPerEnroll(studentId,enrollId){
    return this.http
    .post<any>(`${this.apiUrl}onlineCustomer/getLicenseListPerEnroll`,{studentId,enrollId})
    .pipe(
      map((res) => {
        return res;
      })
    );
  }

  setStudentScheduleInfo(finalArray,enrollData,rangelist){
    return this.http
    .post<any>(`${this.apiUrl}onlineCustomer/setStudentScheduleInfo`,{finalArray,enrollData,rangelist})
    .pipe(
      map((res) => {
        return res;
      })
    );
  }

  getEnrollmentNumberForSchedule(){
    return this.http
    .get<any>(`${this.apiUrl}onlineCustomer/getEnrollmentNumberForSchedule`)
    .pipe(
      map((res) => {
        return res;
      })
    );
  }

  getSchedulePerEnroll(studentInfo,statusid,enrollData){
    return this.http
    .post<any>(`${this.apiUrl}onlineCustomer/getSchedulePerEnroll`,{studentInfo,statusid,enrollData})
    .pipe(
      map((res) => {
        return res;
      })
    );
  }
  checkPaymentDone(studentInfo){
    return this.http
    .post<any>(`${this.apiUrl}onlineCustomer/checkPaymentDone`,{studentInfo})
    .pipe(
      map((res) => {
        return res;
      })
    );
  }
  checkPaymentDoneForGDLProcess(studentInfo) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/checkPaymentDoneForGDLProcess`, { studentInfo })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  checkSessionPerWeek(enrollData,firstday,lastday,slotSelected) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/checkSessionPerWeek`, { enrollData,firstday,lastday,slotSelected })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  getParticularEnroll(enrollData) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/getParticularEnroll`, { enrollData })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }
  
  setPaymentDetails(enrollValue,amountToBePaid){
    return this.http
    .post<any>(`${this.apiUrl}onlineCustomer/setPaymentDetails`,{enrollValue,amountToBePaid})
    .pipe(
      map((res) => {
        return res;
      })
    );
  }

  deleteStudentSchedule(enrollData){
    return this.http
    .post<any>(`${this.apiUrl}onlineCustomer/deleteStudentSchedule`,{enrollData})
    .pipe(
      map((res) => {
        return res;
      })
    );
  }
}

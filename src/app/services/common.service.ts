import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppService } from '../app.service';
import { License } from '../models/licenseInfo';
import { Lookup } from '../models/LookUp';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  apiUrl: string;
  packInfo: any;
  constructor(private appService: AppService,
    private http: HttpClient, private _snackBar: MatSnackBar, private loader: LoaderService, private router: Router) {
    this.apiUrl = this.getConfig('apiUrl')
  }
  getConfig(key: string) {
    return this.appService.getConfig(key);
  }
  showLoader(value) {
    this.loader.showLoader(value)
  }
  navigate(path){
    this.router.navigate(path);
  }
  getNRICType(): Observable<any> {
    let dataUrl = `${this.apiUrl}webRoutes/getNRICTypeList/`;
    return this.http.get<Lookup[]>(dataUrl)
      .pipe(catchError(this.handleError));
  }
  getPOBList(): Observable<any> {
    let dataUrl = `${this.apiUrl}webRoutes/getPlaceBirth/`;
    return this.http.get<Lookup>(dataUrl)
      .pipe(catchError(this.handleError));
  }
  getNationalityList(): Observable<any> {
    let dataUrl = `${this.apiUrl}webRoutes/getNationalityList/`;
    return this.http.get<Lookup>(dataUrl)
      .pipe(catchError(this.handleError));
  }
  getRaceList(): Observable<any> {
    let dataUrl = `${this.apiUrl}webRoutes/getRaceList/`;
    return this.http.get<Lookup>(dataUrl)
      .pipe(catchError(this.handleError));
  }
  getPostalCode(): Observable<any> {
    let dataUrl = `${this.apiUrl}webRoutes/getPostalCode/`;
    return this.http.get<Lookup>(dataUrl)
      .pipe(catchError(this.handleError));
  }
  getPreferenceList(): Observable<any> {
    let dataUrl = `${this.apiUrl}webRoutes/getPreferenceList/`;
    return this.http.get<Lookup>(dataUrl)
      .pipe(catchError(this.handleError));
  }
  handleError(handleError: any): any {
    throw new Error('Method not implemented.');
  }
  saveDetails(formData: FormData): Observable<any> {
    let dataUrl = `${this.apiUrl}onlineCustomer/setStudentDetails/`
    return this.http
      .post<any>(dataUrl, formData)
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  getBaseLicenseList(){
    let dataUrl = `${this.apiUrl}onlineCustomer/getBaseLicenseList/`;
    return this.http
      .get<any>(dataUrl)
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  setPackageInfoForFlowImage(packDt){
      this.packInfo=packDt;
  }

  getPackageInfoForFlowImage(){
    return this.packInfo;
  }

  getLicenseFlowImage(packDt): Observable<any> {
    let dataUrl = `${this.apiUrl}onlineCustomer/getLicenseFlowImage/`;
    return this.http
      .post<any>(dataUrl, {
        packDt
      })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  checkNRICExistence(NRCINumber: any): Observable<any> {
    let dataUrl = `${this.apiUrl}onlineCustomer/checkNRICExistence/`;
    let param = new HttpParams({
      fromObject: {
        "nric_number": NRCINumber

      }
    })
    return this.http
      .post<any>(dataUrl, param)
      .pipe(
        map((res) => {
          return res;
        })
      );
  }
  checkPassportExistence(PassportNumber: any): Observable<any> {
    let dataUrl = `${this.apiUrl}onlineCustomer/checkNRICExistence/`;
    let param = new HttpParams({
      fromObject: {
        "passport_number": PassportNumber

      }
    })
    return this.http
      .post<any>(dataUrl, param)
      .pipe(
        map((res) => {
          return res;
        })
      );
  }
  checkUsernameExistence(username: any): Observable<any> {
    let dataUrl = `${this.apiUrl}onlineCustomer/checkUsernameExistence/`;
    let param = new HttpParams({
      fromObject: {
        "user_name": username,
      }
    })
    return this.http
      .post<any>(dataUrl, param)
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  getLicenceList(): Observable<any> {
    let dataUrl = `${this.apiUrl}onlineCustomer/getLicenseList/`;
    return this.http
      .get<any>(dataUrl)
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  getStudentInfo(): Observable<any> {
    let dataUrl = `${this.apiUrl}onlineCustomer/getStudentInfo/`;
    return this.http
      .get<any>(dataUrl)
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  checkLicenseApplied(packDt): Observable<any> {
    let dataUrl = `${this.apiUrl}onlineCustomer/checkLicenseApplied/`;
    return this.http
      .post<any>(dataUrl, {
        packDt
      })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  getLicenceListCustomer(licenseInfo: any): Observable<License[]> {
    let dataUrl = `${this.apiUrl}onlineCustomer/getLicenseListForCustomer/`;
    let param = new HttpParams({
      fromObject: {
        "licenseInfo": licenseInfo
      }
    })
    return this.http
      .post<License[]>(dataUrl, { "licenseInfo": licenseInfo }
      )
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  getLicenseListPerBaseLicense(existingLicense: any,licenseInfo: any,base_license:any): Observable<License[]> {
    let dataUrl = `${this.apiUrl}onlineCustomer/getLicenseListPerBaseLicense/`;
    let param = new HttpParams({
      fromObject: {
        "existingLicense":existingLicense,
        "licenseInfo": licenseInfo,
        "base_license":base_license
      }
    })
    return this.http
      .post<License[]>(dataUrl, {"existingLicense":existingLicense, "licenseInfo": licenseInfo,"base_license":base_license }
      )
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  showSnackBar(message: string) {
    this._snackBar.open(message, 'x', {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      duration: 5000
    });
  }
  getPackageInfo(licenseInfo: any,licenseInfo2: any,licenseList: any): Observable<any> {
    let dataUrl = `${this.apiUrl}onlineCustomer/getPackageInfo/`;
    return this.http
      .post<any>(dataUrl, {
        licenseInfo,
        licenseInfo2,
        licenseList
      })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }
  getStatusList() {
    return this.http
      .get<any>(`${this.apiUrl}onlineCustomer/getStatusList`)
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  getStatusListForStudent(enrollValue) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/getStatusListForStudent`, { enrollValue })
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

  checkTimelineForStudent(enrollValue) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/checkStudentTimeLine`, { enrollValue })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  getExistingLicList(): Observable<any> {
    let dataUrl = `${this.apiUrl}webRoutes/getExistingLicense/`;
    return this.http.get<Lookup>(dataUrl)
      .pipe(catchError(this.handleError));
  }
  setStudentPackageDetails(formData) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/setStudentPackageDetails/`, formData  )
      .pipe(
        map((res) => {
          return res;
        })
      );
  }
  checkStudentTimeLine(enrollid) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/checkStudentTimeLine`, { enrollid })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  updateStudentStatusInfo(enrollData, statusdt) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/updateStudentStatusInfo`, { enrollData, statusdt })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  
  viewInstructorDetails(enrollData, statusid) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/viewInstructorDetails`, { enrollData, statusid })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  setCustomerContactDetails(customerObj) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/setStudentPackageDetails`, { customerObj })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }
  checkPaymentDone(studentInfo) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/checkPaymentDone`, { studentInfo })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  getStatusListForStudentOfGDL(enrollValue) {
    return this.http
      .post<any>(`${this.apiUrl}onlineCustomer/getStatusListForStudentOfGDL`, { enrollValue })
      .pipe(
        map((res) => {
          return res;
        })
      );
  }

  getStatusListForTimeLine(enrollvalue){
    return this.http
    .post<any>(`${this.apiUrl}onlineCustomer/getStatusListForTimeLine`,{enrollvalue})
    .pipe(
      map((res) => {
        return res;
      })
    );
  }

 
}



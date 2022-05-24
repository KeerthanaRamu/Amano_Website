import { Component, OnInit } from '@angular/core';
import { NewUser } from 'src/app/models/newUser';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { License, LicenseInfo } from 'src/app/models/licenseInfo';
import { CommonService } from 'src/app/services/common.service';
import { AppService } from 'src/app/app.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LanguageService } from 'src/app/services/language-service';
import { fromEvent, Observable, Subscriber } from 'rxjs';
import { map, startWith, takeWhile } from 'rxjs/operators';
import { FileInput, FileValidator } from 'ngx-material-file-input';
import { Lookup } from 'src/app/models/LookUp';
import * as crypto from 'crypto-js';
import { ActivatedRoute, Router } from '@angular/router';


function autocompleteObjectValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (typeof control.value === 'string') {
      return { 'invalidAutocompleteObject': { value: control.value } }
    }
    return null  /* valid option selected */
  }
}


@Component({
  selector: 'app-license-two',
  templateUrl: './license-two.component.html',
  styleUrls: ['./license-two.component.scss']
})
export class LicenseTwoComponent implements OnInit {
  userRegistration: NewUser = new NewUser();
  existing_license_front_preview;
  existing_license_rear_preview;
  licenseFormGroup: FormGroup;
  licenseInfo2: LicenseInfo = new LicenseInfo();
  selected: any;
  license: License[] = new Array<License>();
  list = [];
  selectedLicense = [];
  buyPage: boolean = false;
  package: any;
  subscription;
  alive: boolean = true;
  showGDLProcess:boolean=false;
  lan: boolean;
  imgSrc: Blob = null;
  existingLicList: Lookup[];
  filterExistingLic: Lookup[];
  existLic;
  translateVal: string;
  licenseInfo = {
    existingLicense_id: null,
    expiry_date: null
  }
  packDt = {
    id: '',
    payment_phase: '',
    first_phase_amount: '',
    final_package_price: '',
    package_english:'',
    second_phase_amount:'',
    third_phase_amount:''
  }
  dialogRef: MatDialogRef<any>;
  handler: any;
  apiUrl: string;
  studentInfo: any;
  baseLicenseData:any;

  base_license= new FormControl('', { validators: [autocompleteObjectValidator()] });

  baseLicenseList: Observable<string[]>;

  constructor(private _formBuilder: FormBuilder, private appService: AppService,
    private commonService: CommonService, public dialog: MatDialog,
     private languageService: LanguageService, private router: Router) {
    this.lan = this.languageService.language == 'en' ? true : false;
    this.translateVal = (localStorage.lang == 'ml' ? 'malay' : 'english');
    this.subscription = this.languageService.languageChanged.pipe(takeWhile(() => this.alive)).subscribe(() => {
      this.lan = this.languageService.language == 'en' ? true : false;
      this.translateVal = (localStorage.lang == 'ml' ? 'malay' : 'english');
    });


  }


  public validation_msgs = {
    'base_license': [
      { type: 'invalidAutocompleteObject', message: 'Base License not recognized. Click one of the options.' }
    ],
  }

  proceed() {
    if (this.list.length > 0 && this.licenseFormGroup.valid) {
      this.buyPage = true;
      this.package=[];
      console.log("selectedLicense============",this.list,this.licenseInfo2);
        this.commonService.getPackageInfo(this.licenseInfo,this.licenseInfo2,this.list).subscribe(res => {
          if(res['status'] == 'Success'){
            this.package=res['data'];
            console.log("res['data']=============",res['data'])
            for(let i=0;i<this.package.length;i++){
                this.package[i].licensePrefix='';
                this.package[i].package_title=this.package[i]['package_'+this.translateVal];
                this.package[i].package_desc=this.package[i]['package_desc_'+this.translateVal];
                this.package[i].package_phase_desc=this.package[i]['package_phase_desc_'+this.translateVal];
              if(this.package[i].licenseList.length > 0){
                    this.package[i].licenseClasses=[];
                    this.package[i].licenseIdList=[]
                for(let j=0;j<this.package[i].licenseList.length;j++){
                    this.package[i].licensePrefix=this.package[i].licensePrefix+'-'+this.package[i].licenseList[j].license_class;
                    this.package[i].licenseClasses.push(this.package[i].licenseList[j].license_class);
                    this.package[i].licenseIdList.push(this.package[i].licenseList[j].licenseid);
                    for(let k=0;k<this.selectedLicense.length;k++){
                      if(this.selectedLicense[k].id == this.package[i].licenseList[j].licenseid){
                        this.package[i].licenseList[j].license_category=this.selectedLicense[k].license_category;
                      }else{
                        this.package[i].licenseList[j].license_category=null;
                      }
                    }
                }
              }
            }
            console.log("this.package[i].licenseList-------------",this.package)

          }
        })
    }
    else {
      this.commonService.showSnackBar("Select a license")
    }

  }

  ngOnInit(): void {
    this.getLicenseFormFields();
    this.getLicenceListForCustomer();
    this.getExistingLicList();
    this.getStudentInfo();
    this.getBaseLicenseList();
    this.list = [];
    this.selectedLicense = [];

    this.apiUrl = this.commonService.getConfig('apiUrl');
  }

  getBaseLicenseList(){
    this.commonService.getBaseLicenseList()
      .subscribe(res=>{
        this.baseLicenseData=res;
        this.baseLicenseList = this.base_license.valueChanges.pipe(
          startWith(''),
          map(value => (typeof value === 'string' ? value : value[this.translateVal])),
          map(name => (name ? this._filterBaseLicense(name) : this.baseLicenseData.slice())),
        );
      })
  }

  displayFnBaseLicense(user): string {
    return user && user.license_class ? user.license_class : '';
  } 

  private _filterBaseLicense(name: string): [] {
    const filterValue = name.toLowerCase();
    return this.baseLicenseData.filter(option => option[this.translateVal].toLowerCase().includes(filterValue));
  }

  getStudentInfo(){
    this.commonService.getStudentInfo().subscribe(res => {
      if (res) {
        this.studentInfo = res;
      }
    })
  }

  getLicenseFormFields() {
    this.licenseFormGroup = this._formBuilder.group({
      ExistingLicense: [''],
      LicenseExpiryDate: [''],
      existing_license_front: [''],
      existing_license_rear: [''],
      existing_license_front_name: [{ value: undefined, disabled: false }, [FileValidator.maxContentSize(4194304)]],
      existing_license_rear_name: [{ value: undefined, disabled: false }, [FileValidator.maxContentSize(4194304)]],
      cdl_licence: new FormControl('0'),
      gdlLicense:[false],
      psvLicense:[false]
    })
  }
  get validate() {
    return this.licenseFormGroup.controls;
  }
  onFileChangePhoto(event, filetype) {
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      const blob = new Blob([file], { type: event.target.files[0].type });
      this[filetype + '_preview'] = blob;
      this.licenseFormGroup.patchValue({
        [filetype]: file
      })
    }
  }
  readFile(file: File | Blob): Observable<any> {
    const reader = new FileReader();
    let loadend = fromEvent(reader, 'loadend').pipe(
      map((read: any) => {
        return read.target.result;
      })
    );
    reader.readAsDataURL(file);
    return loadend;
  }

  getLicenceListForCustomer() {
    this.license=[];
    this.base_license.setValue('');
    console.log("this.studentInfo---------",this.studentInfo)
    this.licenseInfo2.cdl_license = this.licenseFormGroup.get('cdl_licence').value;
    this.commonService.getLicenceListCustomer(this.licenseInfo2).subscribe(res => {
      if (res) {
        this.license = res;
        if(this.licenseInfo.existingLicense_id == 3){
          console.log("re----nric-----------",this.licenseInfo2.cdl_license);
          if((this.studentInfo.nric_type == 1 || this.studentInfo.nric_type == 2) && this.studentInfo.age >= 21 && this.licenseFormGroup.get('cdl_licence').value == 1){
            this.showGDLProcess=true;
          }else{
            this.base_license.patchValue('');
            this.licenseFormGroup.patchValue({
              gdlLicense:false,
              psvLicense:false
            })
            this.showGDLProcess=false;
          }
        }else{
            this.base_license.patchValue('');
            this.licenseFormGroup.patchValue({
              gdlLicense:false,
              psvLicense:false
            })
            this.showGDLProcess=false;
        }
      }
    })
  }

  getLicenseListPerBaseLicense(){
    console.log("this.licenseInfo2,this.base_license.value====",this.licenseInfo2,this.base_license.value);
    if(this.base_license.value){
      this.commonService.getLicenseListPerBaseLicense(this.licenseInfo,this.licenseInfo2,this.base_license.value).subscribe(res => {
        if (res) {
          this.license = res;
        }
      })
    }else{
      this.getLicenceListForCustomer();
    }
  }

  selectedExistingLicense(event){
    if(this.licenseInfo.existingLicense_id){
      if(this.licenseInfo.existingLicense_id == 3){
        console.log("studentInfo----------",this.studentInfo)
        if((this.studentInfo.nric_type == 1 || this.studentInfo.nric_type == 2) && this.studentInfo.age >= 21 && this.licenseFormGroup.get('cdl_licence').value == 1){
          this.showGDLProcess=true;
        }else{
          this.showGDLProcess=false;
        }
      }else{
        this.showGDLProcess=false;
      }
    }
    this.getLicenceListForCustomer();
  }

  onLicenseChangeGDL(event){
    if(this.licenseFormGroup.value.gdlLicense == true){
        this.licenseFormGroup.patchValue({
          'psvLicense':false
        })
    }
    if(this.licenseFormGroup.value.psvLicense == true){
      this.licenseFormGroup.patchValue({
        'gdlLicense':false
      })
    }
  }

  onLicenseChangePSV(event){
    if(this.licenseFormGroup.value.psvLicense == true){
      this.licenseFormGroup.patchValue({
        'gdlLicense':false
      })
    }
  }

  viewPackageImage(packDt){
    packDt['packageStage']="Apply";
   this.commonService.setPackageInfoForFlowImage(packDt);
   this.router.navigate(['/view-package'])
  }


  packageChecked(event, lic) {
    if (event) {
      this.list.push(lic.id);
      this.selectedLicense.push(lic);
    }
    else{
      this.list = this.list.filter(f => f != lic.id);
      this.selectedLicense = this.selectedLicense.filter(f => f.id != lic.id);
    }
  }

  receipt(pack) {
    let first_phase_amt=0;
    for(let i=0;i<pack.licenseList.length;i++){
      first_phase_amt=first_phase_amt+Number(pack.licenseList[i].first_phase_amount);
    } 
    console.log("pack==========",pack)
      var payamount = pack.payment_phase == 1 ? pack.final_package_price : first_phase_amt;
       const formData = new FormData();
       let licenseInfo={
        existingLicense_id: this.licenseFormGroup.get('ExistingLicense').value,
        expiry_date:this.licenseFormGroup.get('LicenseExpiryDate').value
       }
        formData.append('packDt', JSON.stringify(pack));
        formData.append('licenseInfo',JSON.stringify(licenseInfo));
        formData.append('existing_license_front', this.licenseFormGroup.get('existing_license_front').value);
        formData.append('existing_license_rear',this.licenseFormGroup.get('existing_license_rear').value);
        formData.append('gdlLicense', this.licenseFormGroup.value.gdlLicense);
        formData.append('psvLicense', this.licenseFormGroup.value.psvLicense);
        
          this.commonService.checkLicenseApplied(pack,this.licenseFormGroup.value.gdlLicense,this.licenseFormGroup.value.psvLicense).subscribe(res => {
            if (res) {
              if(res.status == 'Success'){
                this.commonService.setStudentPackageDetails(formData).subscribe(studres => {
                  if (studres) {
                    let studData=studres.data;
                    for(let i=0;i<pack.licenseIdList.length;i++){
                      studData.enrollment_no = studData.enrollment_no + '_'+pack.licenseIdList[i];
                    }
                    console.log("studData.enrollment_no----------",studData.enrollment_no);
                    
                       this.pay_senangpay(studData.name,studData.email_id,studData.mobile_number,payamount,pack.package_english,studData.enrollment_no,'');
                     }
                })
              }else{
                this.commonService.showSnackBar("Already Applied!!")
              }
            
            }
          })
  }

  
  getExistingLicList() {
    this.commonService.getExistingLicList().subscribe(res => {
      this.existingLicList = res;
      this.filterExistingLic = res;

    })
  }
  displayfn(id) {
    return this.existingLicList?.find(f => f.id == id)[this.translateVal];
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


  backToLicense(){
    this.list = [];
  }


}

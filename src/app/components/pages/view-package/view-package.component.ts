import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { CommonService } from 'src/app/services/common.service';
import { AppService } from 'src/app/app.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LanguageService } from 'src/app/services/language-service';
import {   takeWhile } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-view-package',
  templateUrl: './view-package.component.html',
  styleUrls: ['./view-package.component.scss']
})
export class ViewPackageComponent implements OnInit {
  translateVal: string;
  subscription;
  lan: boolean;
  alive: boolean = true;
  packData: any;
  licenseFlowImage: any;
  apiUrl: string;
  imageObject:any=[];
  currentIndex;
  showFlag: boolean = false;
  selectedImageIndex: number = -1;

  constructor(private _formBuilder: FormBuilder, private appService: AppService,private router:Router,
    private commonService: CommonService, public dialog: MatDialog, private languageService: LanguageService) {
    this.lan = this.languageService.language == 'en' ? true : false;
    this.translateVal = (localStorage.lang == 'ml' ? 'malay' : 'english');
    this.subscription = this.languageService.languageChanged.pipe(takeWhile(() => this.alive)).subscribe(() => {
      this.lan = this.languageService.language == 'en' ? true : false;
      this.translateVal = (localStorage.lang == 'ml' ? 'malay' : 'english');
      this.packData=this.commonService.getPackageInfoForFlowImage();
        if(this.packData){
          this.getLicenseFlowImage(this.packData);
        }else{
          this.commonService.showLoader(false);
          this.router.navigate(['/liense-2']);

        }
    });
  }


  ngOnInit(): void {
    this.apiUrl = this.commonService.getConfig('apiUrl');
  }

  getLicenseFlowImage(packDt){
    this.imageObject=[];
    this.commonService.getLicenseFlowImage(packDt)
    .subscribe((res)=>{
     this.commonService.showLoader(false);
      let resObj=res;
      console.log("resObj-----view--------",resObj)
      for(let i=0;i<resObj.length;i++){
       resObj[i].license_desc=resObj[i]['license_desc_'+this.translateVal];
       this.imageObject.push({
         'image': this.apiUrl + resObj[i].license_flow,
         'title': resObj[i].license_class
       })
      }
       this.licenseFlowImage=resObj;
       this.imageObject.push({
        'image': '../../../../assets/img/dress-code-male.png',
        'title':'Dress Code Male'
        },{
          'image': '../../../../assets/img/dress-code-female.png',
          'title':'Dress Code Female'
        })
        console.log("this.imageObject----",this.imageObject)

    })
   }
 
   backToPackage(){
    this.router.navigate(['/license-2']);
   }

   showLightbox(index) {
      this.selectedImageIndex = index;
      this.showFlag = true;
    }

    closeEventHandler() {
        this.showFlag = false;
        this.currentIndex = -1;
    }


}

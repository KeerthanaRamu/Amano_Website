import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {

  constructor(public dialog: MatDialog) { }
@Input() data;
@Input() packDt;
@Input() licenseData;
@Input() payInfo;
@Input() enrollment_no;

  ngOnInit(): void {
  }
  print() {
    console.log(this.data)
    window.print();
  }

}

import { Component, ViewChild, OnInit, ElementRef, AfterViewInit } from '@angular/core';
import WebViewer from '@pdftron/pdfjs-express';
import ExpressUtils from '@pdftron/pdfjs-express-utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('viewer', { static: false }) viewer: ElementRef;
  wvInstance: any;

  ngAfterViewInit(): void {

    WebViewer({
      path: '../lib',
      initialDoc: '../files/sample.pdf'
    }, this.viewer.nativeElement).then(instance => {
      this.wvInstance = instance;
      const utils = new ExpressUtils();
      const { docViewer, annotManager } = instance;
      docViewer.on('documentLoaded', () => {
        docViewer.getAnnotationsLoadedPromise().then(() => {
          // iterate over fields
          const fieldManager = annotManager.getFieldManager();
          fieldManager.forEachField(field => {
            console.log(field.getValue());
          });
        });
      });
      // now you can access APIs through this.webviewer.getInstance()

      // or listen to events from the viewer element
      this.viewer.nativeElement.addEventListener('pageChanged', (e) => {
        const [pageNumber] = e.detail;
        console.log(`Current page is ${pageNumber}`);
      });

      instance.setHeaderItems((header) => {
        header.push({
          type: 'actionButton',
          img: '',
          onClick: async () => {
            const xfdf = await annotManager.exportAnnotations({ links: false, widgets: false });
            const fileData = await docViewer.getDocument().getFileData({});
            const resp = await utils.setFile(fileData).setXFDF(xfdf).merge();
            const mergedBlob = await resp.getBlob();
            // saveAs(mergedBlob, 'myfile.pdf')
            await resp.deleteFile();
          }
        });
      });

      // or from the docViewer instance
      instance.docViewer.on('annotationsLoaded', () => {
        console.log('annotations loaded');
      });

      instance.docViewer.on('documentLoaded', this.wvDocumentLoadedHandler)
    });
  }

  ngOnInit() {
    // const utils = new ExpressUtils();
    this.wvDocumentLoadedHandler = this.wvDocumentLoadedHandler.bind(this);
    // utils.setFile('../files/fw9.pdf');
    // const response = await utils.extract(); // extract XFDF
    // const { xfdf } = response;
  }

  getValues(){
    const { docViewer, annotManager } = this.wvInstance;

      docViewer.getAnnotationsLoadedPromise().then(() => {
        // iterate over fields
        const fieldManager = annotManager.getFieldManager();
        fieldManager.forEachField(field => {
          console.log(field.getValue());
          field.setValue('new value');
        });
      });

  }

  wvDocumentLoadedHandler(): void {
    // you can access docViewer object for low-level APIs
    const docViewer = this.wvInstance;
    const annotManager = this.wvInstance.annotManager;
    // and access classes defined in the WebViewer iframe
    // const { Annotations } = this.wvInstance;
    // const rectangle = new Annotations.RectangleAnnotation();
    // rectangle.PageNumber = 1;
    // rectangle.X = 100;
    // rectangle.Y = 100;
    // rectangle.Width = 250;
    // rectangle.Height = 250;
    // rectangle.StrokeThickness = 5;
    // rectangle.Author = annotManager.getCurrentUser();
    // annotManager.addAnnotation(rectangle);
    // annotManager.drawAnnotations(rectangle.PageNumber);
    // see https://www.pdftron.com/api/web/WebViewer.html for the full list of low-level APIs
  }
}

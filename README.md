# tang-image-editor

## Quickstart
```javascript
import TangImageEditor from 'tang-image-editor';
import 'tang-image-editor/index.css';

const colorPickerInstance = new TangImageEditor('#colorPicker', {
  imgSrc: 'https://scaleflex.cloudimg.io/v7/demo/river.png', // picture url
  color: '#F56C6C', // default color
  lineWidth: 5, // line width
  maxWidth: 500, // render area maxWidth
  maxHeight: 500, // render area maxHeight
});

// change ImageSource
colorPickerInstance.setImageSrc('https://fuss10.elemecdn.com/9/bb/e27858e973f5d7d3904835f46abbdjpeg.jpeg');
```
![image](https://user-images.githubusercontent.com/8178166/162382311-ced9648b-bab9-4115-b2f5-688f53d463c3.png)

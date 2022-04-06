/*
 * @Description: 图片编辑
 * @Author: tangguowei
 * @Date: 2022-03-31 11:39:06
 * @LastEditors: tangguowei
 * @LastEditTime: 2022-04-06 18:28:21
 */
import colorPicker from 'tui-color-picker';
import 'tui-color-picker/dist/tui-color-picker.css';
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';

class TangImageEditor {
  // 图片画板、最终画板
  pictureDom = null;
  pictureCtx = null;
  // 编辑画板
  canvasDom = null;
  canvasCtx = null;
  options = {
    // 预设编辑显示区域
    maxWidth: 800,
    maxHeight: 500,
    lineWidth: 2,
    color: '#ff0000',
  };
  // 画布实际展示尺寸
  width = 0;
  height = 0;
  // 历史记录
  historyData = [];
  // 当前操作步骤索引
  currentIndex = -1;
  // 作画的位置
  position = {
    x: 0,
    y: 0,
  };
  // 是否作画过程中
  isDrawing = false;
  // 颜色选择实例
  colorPickerInstance = null;
  constructor(element, options = {}) {
    if (!options.imgSrc) {
      throw new Error('图片路径不能为空');
    }
    this.options = {
      ...this.options,
      ...options,
    };
    if (typeof element === 'string') {
      this.wrapper = document.querySelector(element);
    } else {
      this.wrapper = element;
    }
    this.init();
  }
  // 组件初始化
  init() {
    const { imgSrc, maxWidth, maxHeight } = this.options;
    const tempMaxHeight = maxHeight - 50 * 2;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
    img.onload = () => {
      // 调整画板尺寸
      const scale = img.width / img.height;
      if (scale > (maxWidth / tempMaxHeight)) {
        this.width = maxWidth;
        this.height = Number.parseInt(maxWidth / scale);
      } else {
        this.width = Number.parseInt(tempMaxHeight * scale);
        this.height = tempMaxHeight;
      }
      this.initDom();
      this.bindAllEvents();
      this.pictureDom.width = this.width;
      this.pictureDom.height = this.height;
      this.canvasDom.width = this.width;
      this.canvasDom.height = this.height;
      // TODO：初始图片加载不出来
      setTimeout(() => {
        this.pictureCtx.drawImage(img, 0, 0, this.width, this.height);
      })
    }
  }
  // 初始化dom
  initDom() {
    const styleDom = document.createElement('style');
    styleDom.innerHTML = `
      .tang_submenubar, .tang_menubar_parameter {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 14px;
        background: #fff;
      }
      .tang_submenubar > *, .tang_menubar_parameter > * {
        height: 22px;
      }
      .tang_color {
        width: 22px;
        box-sizing: border-box;
        border: 1px solid #d3d3d3;
      }
      .tang_submenubar > * + *, .tang_menubar_parameter > * + * {
        margin-left: 10px;
      }
      .tang_content {
        position: relative;
      }
      .tang_picture {
        display: block;
      }
      .tang_draw {
        position: absolute;
        left: 0;
        top: 0;
      }
      .tang_color_picker {
        display: none;
        padding: 20px;
        background: #fff;
        width: 152px;
        position: absolute;
        box-shadow: 0px 0px 12px rgba(0, 0, 0, .12);
      }
      .tang_stroke_val {
        min-width: 44px;
      }
      .noUi-horizontal .noUi-handle {
        width: 20px;
        height: 20px;
        border-radius: 50%;
      }
      .noUi-horizontal .noUi-handle::before, .noUi-horizontal .noUi-handle::after {
        display: none;
      }
    `;
    document.head.appendChild(styleDom);
    this.wrapper.innerHTML = `
      <div class="tang_submenubar"></div>
      <div class="tang_content">
        <canvas class="tang_picture" width="${this.width}" height="${this.height}"></canvas>
        <canvas class="tang_draw" width="${this.width}" height="${this.height}"></canvas>
      </div>
      <div class="tang_menubar_parameter">
        <i class="tang_color" style="background: ${this.options.color};"></i>
        <div class="tang_stroke" style="width: 200px; margin-right: 5px; height: 10px;"></div>
        <i class="tang_stroke_val">${this.options.lineWidth}px</i>
      </div>
      <div class="tang_color_picker"></div>
    `;
    this.wrapper.style.width = `${this.width}px`;
    this.wrapper.style.position = 'relative';
    this.pictureDom = this.wrapper.querySelector('.tang_picture');
    this.pictureCtx = this.pictureDom.getContext("2d");
    this.canvasDom = this.wrapper.querySelector('.tang_draw');
    this.canvasCtx = this.canvasDom.getContext("2d");

    // 颜色选择器
    const colorPickerDom = this.wrapper.querySelector('.tang_color_picker');
    this.colorPickerInstance = colorPicker.create({
      container: colorPickerDom,
      color: this.options.color,
    });
    this.initSubmenuDom();
    const colorDom = this.wrapper.querySelector('.tang_color');
    colorPickerDom.style.left = `${colorDom.offsetLeft}px`;
    colorPickerDom.style.top = `${colorDom.offsetTop + colorDom.clientHeight}px`;

    // 线条宽度
    const strokeDom = this.wrapper.querySelector('.tang_stroke');
    noUiSlider.create(strokeDom, {
      start: this.options.lineWidth,
      range: {
        'min': 1,
        'max': 100
      },
      connect: 'lower',
    });
    const strokeValDom = this.wrapper.querySelector('.tang_stroke_val');
    strokeDom.noUiSlider.on('update', (values) => {
      const value = Number.parseInt(values[0]);
      strokeValDom.innerHTML = `${value}px`;
      this.options.lineWidth = value;
    });
  }
  // 更新次级菜单状态
  initSubmenuDom() {
    this.wrapper.querySelector('.tang_submenubar').innerHTML = `
      <button
        ${!this.historyData.length ? 'disabled' : ''}
        class="tang_reset"
      >重置</button>
      <button
        ${this.currentIndex < 0 ? 'disabled' : ''}
        class="tang_prev"
      >上一步</button>
      <button
        ${this.currentIndex >= this.historyData.length - 1 ? 'disabled' : ''}
        class="tang_next"
      >下一步</button>
    `;
  }
  // 绑定事件
  bindAllEvents() {
    this.canvasDom.removeEventListener('mousedown', this.handleMousedown);
    this.canvasDom.addEventListener('mousedown', this.handleMousedown.bind(this));
    this.canvasDom.removeEventListener('mousemove', this.handleMousemove);
    this.canvasDom.addEventListener('mousemove', this.handleMousemove.bind(this));
    document.body.removeEventListener('mouseup', this.handleMouseup);
    document.body.addEventListener('mouseup', this.handleMouseup.bind(this));

    document.body.removeEventListener('click', this.handleSubmenu);
    document.body.addEventListener('click', this.handleSubmenu.bind(this));

    document.body.removeEventListener('click', this.handleColor);
    document.body.addEventListener('click', this.handleColor.bind(this));
  }
  handleColor(event) {
    let target = event.target;
    let isTarget = false;
    const picker = this.wrapper.querySelector('.tang_color_picker');
    while (target) {
      if (target.className === 'tang_color') {
        picker.style.display = 'block';
        isTarget = true;
        break;
      } else if (target.className === 'tang_color_picker') {
        isTarget = true;
        break;
      }
      target = target.parentNode;
    }
    if (!isTarget) {
      picker.style.display = 'none';
      const color = this.colorPickerInstance.getColor();
      const tangColorDom = this.wrapper.querySelector('.tang_color');
      tangColorDom.style.background = color;
    }
  }
  // 开始绘制
  handleMousedown(event) {
    this.position.x = event.offsetX;
    this.position.y = event.offsetY;
    this.isDrawing = true;
    this.canvasCtx.beginPath();
    this.canvasCtx.lineCap = 'round';
    this.canvasCtx.lineWidth = this.options.lineWidth;
    this.canvasCtx.strokeStyle = this.colorPickerInstance.getColor(); // 红色路径
    this.canvasCtx.lineTo(event.offsetX, event.offsetY);
    this.canvasCtx.stroke(); // 进行绘制
  }
  // 绘制
  handleMousemove(event) {
    if (!this.isDrawing) return;
    this.canvasCtx.moveTo(this.position.x, this.position.y);
    this.canvasCtx.lineTo(event.offsetX, event.offsetY);
    this.canvasCtx.stroke(); // 进行绘制
    this.position.x = event.offsetX;
    this.position.y = event.offsetY;
  }
  // 绘制结束
  handleMouseup() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.position.x = 0;
    this.position.y = 0;
    const imageData = this.canvasCtx.getImageData(0, 0, this.width, this.height);
    const newIndex = this.currentIndex + 1;
    this.historyData.splice(newIndex, this.historyData.length - newIndex, imageData);
    this.currentIndex = newIndex;
    this.initSubmenuDom();
  }
  handleSubmenu(event) {
    const target = event.target;
    const thin = target.parentNode.parentNode;
    if ([thin, thin.parentNode].includes(this.wrapper)) {
      switch (target.className) {
        case 'tang_reset':
          this.handleRest();
          break;
        case 'tang_prev':
          this.handlePrev();
          break;
        case 'tang_next':
          this.handleNext();
          break;
        default:
      }
    }
  }
  // 上一步
  handlePrev() {
    this.currentIndex -= 1;
    this.drawHistory();
  }
  // 下一步
  handleNext() {
    this.currentIndex += 1;
    this.drawHistory();
  }
  // 清除
  handleRest() {
    this.currentIndex = -1;
    this.historyData = [];
    this.drawHistory();
  }
  drawHistory() {
    if (this.currentIndex > -1) {
      const imageData = this.historyData[this.currentIndex];
      this.canvasCtx.putImageData(imageData, 0, 0);
    } else {
      this.canvasCtx.clearRect(0, 0, this.width, this.height);
    }
    this.initSubmenuDom();
  }
  // 保存图片回调
  async toDataURL() {
    return new Promise(resolve => {
      const img = new Image();
      img.src = this.canvasDom.toDataURL('image/png');
      img.onload = () => {
        // TODO：初始图片加载不出来
        setTimeout(() => {
          this.pictureCtx.drawImage(img, 0, 0, this.width, this.height);
          const dataUrl = this.pictureDom.toDataURL('image/png');
          this.handleRest();
          resolve(dataUrl);
        })
      }
    })
  }
}

export default TangImageEditor;

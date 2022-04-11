/*
 * @Description: 图片编辑
 * @Author: tangguowei
 * @Date: 2022-03-31 11:39:06
 * @LastEditors: tangguowei
 * @LastEditTime: 2022-04-11 12:26:37
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
  // 初始渲染模块的配置
  firstOptions = {
    color: '',
    lineWidth: 0,
  };
  // 画布实际展示尺寸
  width = 0;
  height = 0;
  originalImage = null;
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

  // 颜色选择器
  colorPickerDom = null;
  // 颜色选择器实例
  colorPickerInstance = null;

  // 滑块实例
  noUiSliderInstance = null;
  // 线条宽度
  strokeValDom = null;
  constructor(element, options = {}) {
    if (!options.imgSrc) {
      throw new Error('图片路径不能为空');
    }
    this.options = {
      ...this.options,
      ...options,
    };
    this.firstOptions.color = this.options.color;
    this.firstOptions.lineWidth = this.options.lineWidth;
    if (typeof element === 'string') {
      this.wrapper = document.querySelector(element);
    } else {
      this.wrapper = element;
    }
    this.setImageSrc(this.options.imgSrc, true);
  }
  /**
   * @description: 切换画板的图片源
   * @param {*} url 图片路径
   * @param {*} isInit 是否初始化画板
   * @return {*}
   */
  setImageSrc(url, isInit) {
    if (isInit) {
      this.initDom();
      this.bindAllEvents();
    } else {
      const { color, lineWidth } = this.firstOptions;
      this.initColorDom(color);
      this.colorPickerInstance.setColor(color);
      this.initLinewidthDom(lineWidth);
      this.noUiSliderInstance.set(lineWidth);
      this.handleRest();
    }
    const loadingDom = this.wrapper.querySelector('.tang_loading');
    loadingDom.style.visibility = 'visible';
    this.options.imgSrc = url;
    const { imgSrc, maxWidth, maxHeight } = this.options;
    const tempMaxHeight = maxHeight - 40 * 2;
    this.originalImage = new Image();
    this.originalImage.crossOrigin = 'anonymous';
    this.originalImage.src = imgSrc;
    this.originalImage.onload = () => {
      // 调整画板尺寸
      const scale = this.originalImage.width / this.originalImage.height;
      if (scale > (maxWidth / tempMaxHeight)) {
        this.width = maxWidth;
        this.height = Number.parseInt(maxWidth / scale);
      } else {
        this.width = Number.parseInt(tempMaxHeight * scale);
        this.height = tempMaxHeight;
      }
      this.pictureDom.width = this.width;
      this.pictureDom.height = this.height;
      this.canvasDom.width = this.width;
      this.canvasDom.height = this.height;
      this.initColorPickerPosition();

      this.pictureCtx.drawImage(this.originalImage, 0, 0, this.width, this.height);
      loadingDom.style.visibility = 'hidden';
    }
  }
  // 初始化dom
  initDom() {
    this.wrapper.innerHTML = `
      <div class="tang_submenubar">
        <svg t="1649303699973" class="icon tang_reset" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4608" width="20" height="20"><path d="M981.333333 80.64a42.666667 42.666667 0 0 0-42.666666 42.666667v106.666666A512 512 0 0 0 0 512a42.666667 42.666667 0 0 0 85.333333 0 426.666667 426.666667 0 0 1 793.386667-218.026667H768a42.666667 42.666667 0 1 0 0 85.333334h213.333333a42.666667 42.666667 0 0 0 42.666667-42.666667v-213.333333a42.666667 42.666667 0 0 0-42.666667-42.666667zM981.333333 469.333333a42.666667 42.666667 0 0 0-42.666666 42.666667A426.666667 426.666667 0 0 1 145.28 730.026667H256a42.666667 42.666667 0 0 0 0-85.333334H42.666667a42.666667 42.666667 0 0 0-42.666667 42.666667v213.333333a42.666667 42.666667 0 0 0 85.333333 0v-106.666666A512 512 0 0 0 1024 512a42.666667 42.666667 0 0 0-42.666667-42.666667z" fill="#dbdbdb" p-id="4609"></path></svg>
        <svg t="1649303143482" class="icon tang_prev" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2857" width="20" height="20"><path d="M558.08 428.3904h-360.6528l202.0352-202.0352a35.82976 35.82976 0 1 0-50.67776-50.67776l-275.15904 275.13856c-1.7408 1.76128-3.2768 3.6352-4.57728 5.62176a33.792 33.792 0 0 0-2.63168 4.99712c-0.19456 0.41984-0.48128 0.80896-0.64512 1.23904-1.49504 3.6864-2.22208 7.59808-2.43712 11.52-0.04096 0.65536-0.19456 1.30048-0.19456 1.95584 0 0.31744 0.08192 0.63488 0.09216 0.94208a35.57376 35.57376 0 0 0 10.40384 24.41216l275.15904 275.13856a35.84 35.84 0 0 0 50.67776-50.67776l-225.8944-225.8944h384.50176c186.32704 0 337.92 151.59296 337.92 337.92v3.40992a35.84 35.84 0 1 0 71.68 0v-3.40992c0-226.22208-183.38816-409.6-409.6-409.6z" fill="#dbdbdb" p-id="2858"></path></svg>
        <svg t="1649303143482" class="icon tang_next" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2857" width="20" height="20"><path d="M558.08 428.3904h-360.6528l202.0352-202.0352a35.82976 35.82976 0 1 0-50.67776-50.67776l-275.15904 275.13856c-1.7408 1.76128-3.2768 3.6352-4.57728 5.62176a33.792 33.792 0 0 0-2.63168 4.99712c-0.19456 0.41984-0.48128 0.80896-0.64512 1.23904-1.49504 3.6864-2.22208 7.59808-2.43712 11.52-0.04096 0.65536-0.19456 1.30048-0.19456 1.95584 0 0.31744 0.08192 0.63488 0.09216 0.94208a35.57376 35.57376 0 0 0 10.40384 24.41216l275.15904 275.13856a35.84 35.84 0 0 0 50.67776-50.67776l-225.8944-225.8944h384.50176c186.32704 0 337.92 151.59296 337.92 337.92v3.40992a35.84 35.84 0 1 0 71.68 0v-3.40992c0-226.22208-183.38816-409.6-409.6-409.6z" fill="#dbdbdb" p-id="2858"></path></svg>
      </div>
      <div class="tang_content">
        <canvas class="tang_picture"></canvas>
        <canvas class="tang_draw"></canvas>
      </div>
      <div class="tang_menubar_parameter">
        <i class="tang_color" style="background: ${this.options.color};"></i>
        <div class="tang_stroke"></div>
        <i class="tang_stroke_val">${this.options.lineWidth}px</i>
      </div>
      <div class="tang_color_picker"></div>
      <div class="tang_loading"><svg class="circular" viewBox="25 25 50 50"><circle class="path" cx="50" cy="50" r="20" fill="none"></circle></svg></div>
    `;
    this.wrapper.style.width = `${this.options.maxWidth}px`;
    this.wrapper.style.position = 'relative';
    this.pictureDom = this.wrapper.querySelector('.tang_picture');
    this.pictureCtx = this.pictureDom.getContext("2d");
    this.canvasDom = this.wrapper.querySelector('.tang_draw');
    this.canvasCtx = this.canvasDom.getContext("2d");

    // 颜色选择器
    this.colorPickerDom = this.wrapper.querySelector('.tang_color_picker');
    this.colorPickerInstance = colorPicker.create({
      container: this.colorPickerDom,
      color: this.options.color,
    });
    this.colorDom = this.wrapper.querySelector('.tang_color');
    this.colorPickerInstance.on('selectColor', ({ color }) => {
      this.initColorDom(color);
    })
    this.initSubmenuDom();

    // 线条宽度
    const strokeDom = this.wrapper.querySelector('.tang_stroke');
    this.noUiSliderInstance = noUiSlider.create(strokeDom, {
      start: this.options.lineWidth,
      range: {
        'min': 1,
        'max': 50
      },
      connect: 'lower',
    });
    this.strokeValDom = this.wrapper.querySelector('.tang_stroke_val');
    strokeDom.noUiSlider.on('update', (values) => {
      const value = Number.parseInt(values[0]);
      this.initLinewidthDom(value);
    });
  }
  // 渲染颜色
  initColorDom(color) {
    this.colorDom.style.background = color;
    this.options.color = color;
  }
  // 渲染线条宽度
  initLinewidthDom(value) {
    this.strokeValDom.innerHTML = `${value}px`;
    this.options.lineWidth = value;
  }
  // 更新次级菜单状态
  initSubmenuDom() {
    const reset = this.wrapper.querySelector('.tang_reset');
    const prev = this.wrapper.querySelector('.tang_prev');
    const next = this.wrapper.querySelector('.tang_next');
    const activeColor = '#515151';
    const defaultColor = '#dbdbdb';
    if (this.historyData.length) {
      reset.setAttribute('class', reset.getAttribute('class') + ' active');
      reset.querySelector('path').setAttribute('fill', activeColor);
    } else {
      reset.setAttribute('class', reset.getAttribute('class').replace(/\s?active/g, ''));
      reset.querySelector('path').setAttribute('fill', defaultColor);
    }
    if (this.currentIndex >= 0) {
      prev.setAttribute('class', prev.getAttribute('class') + ' active');
      prev.querySelector('path').setAttribute('fill', activeColor);
    } else {
      prev.setAttribute('class', prev.getAttribute('class').replace(/\s?active/g, ''));
      prev.querySelector('path').setAttribute('fill', defaultColor);
    }
    if (this.currentIndex < this.historyData.length - 1) {
      next.setAttribute('class', next.getAttribute('class') + ' active');
      next.querySelector('path').setAttribute('fill', activeColor);
    } else {
      next.setAttribute('class', next.getAttribute('class').replace(/\s?active/g, ''));
      next.querySelector('path').setAttribute('fill', defaultColor);
    }
  }
  // 初始化颜色选择器位置
  initColorPickerPosition() {
    this.colorPickerDom.style.left = `${this.colorDom.offsetLeft}px`;
    this.colorPickerDom.style.top = `${this.colorDom.offsetTop - this.colorPickerDom.clientHeight}px`;
  }
  // 绑定事件
  bindAllEvents() {
    this.canvasDom.removeEventListener('mousedown', this.handleMousedown);
    this.canvasDom.addEventListener('mousedown', this.handleMousedown.bind(this));
    this.canvasDom.removeEventListener('mousemove', this.handleMousemove);
    this.canvasDom.addEventListener('mousemove', this.handleMousemove.bind(this));
    document.body.removeEventListener('mouseup', this.handleMouseup);
    document.body.addEventListener('mouseup', this.handleMouseup.bind(this));

    document.body.removeEventListener('mousedown', this.handleSubmenu);
    document.body.addEventListener('mousedown', this.handleSubmenu.bind(this));

    document.body.removeEventListener('mousedown', this.handleColor);
    document.body.addEventListener('mousedown', this.handleColor.bind(this));
  }
  handleColor(event) {
    let target = event.target;
    let isTarget = false;
    while (target) {
      if (target === this.colorDom) {
        this.colorPickerDom.style.visibility = 'visible';
        isTarget = true;
        break;
      } else if (target === this.colorPickerDom) {
        isTarget = true;
        break;
      }
      target = target.parentNode;
    }
    if (!isTarget) {
      this.colorPickerDom.style.visibility = 'hidden';
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
    this.canvasCtx.strokeStyle = this.options.color; // 红色路径
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
    let target = event.target;
    const classes = (target.getAttribute('class') || '').split(' ');
    if (classes.includes('active') && target.parentNode === this.wrapper.querySelector('.tang_submenubar')) {
      if (classes.includes('tang_reset')) {
        this.handleRest();
      } else if (classes.includes('tang_prev')) {
        this.handlePrev();
      } else if (classes.includes('tang_next')) {
        this.handleNext();
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
      const { width, height } = this.originalImage;
      const img = new Image();
      img.width = width;
      img.height = height;
      img.src = this.canvasDom.toDataURL('image/png');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.originalImage, 0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      }
    })
  }
}

export default TangImageEditor;

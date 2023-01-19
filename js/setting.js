const videoElement = document.createElement('video');
const rtcCanvas = document.createElement('canvas');
let options = {
  multiplier: 0.75,
  stride: 16,
  quantBytes: 4,
};

let net;
bodyPix.load(options).then((asdf) => (net = asdf));

var micTester, bgRenderer;
const audioContext = new AudioContext();

const param = {
  voice: {
    mic: {
      device: null,
      label: null,
      volume: 1,
    },
    speaker: {
      device: null,
      label: null,
      volume: 0.5,
    },
  },
  video: {
    device: null,
    label: null,
    previewModal: false,
  },
  background: {
    img: null,
  },
};

/**
 * Voice Setting
 */
async function voiceSettingInit() {
  settingWindowOpen('voice');
  // 설정창 초기화...
  let testStream = await window.navigator.mediaDevices.getUserMedia({
    audio: { deviceId: { exact: $('.popup_setting_selectbox[name=mic]', self.popup_setting_wrap).val() }, echoCancellation: true, noiseSuppression: true },
  });

  const micSelect = $('.popup_setting_selectbox[name=mic]', self.popup_setting_wrap);
  micSelect.off().on('change', function (e) {
    window.navigator.mediaDevices
      .getUserMedia({ audio: { deviceId: { exact: micSelect.val() }, echoCancellation: true, noiseSuppression: true } })
      .then((stream) => (testStream = stream));
    testBtnInit();
  });

  // 마이크 테스트 버튼
  const testBtn = $('.mictest_btn', self.popup_setting_wrap);
  testBtn.off().on('click', function (e) {
    const bar = $('.mic_progress_gradient_wrap', self.popup_setting_wrap);
    if (testBtn.text() === '테스트 시작') {
      testBtn.text('테스트 중지');

      const soruceNode = audioContext.createMediaStreamSource(testStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      soruceNode.connect(analyser);

      tester();

      function tester() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        let soundSize = 0;
        soundSize = Math.max(...dataArray);
        bar.width(`${((soundSize - 128) / 128) * 100}%`);
        micTester = requestAnimationFrame(() => {
          tester();
        });
      }
    } else {
      testBtn.text('테스트 시작');
      cancelAnimationFrame(micTester);
      micTester = null;
      bar.width('0%');
    }
  });

  // 음성 설정 저장...
  self.setting_window.voice.save.off().on('click', voiceSettingSave);

  // 음성 설정 초기화..
  self.setting_window.voice.reset.off().on('click', voiceSettingReset);

  // 음성 설정 창 닫기..
  self.setting_window.voice.close.off().on('click', voiceSettingClose);

  micSelectInit(param.voice.mic.label);
  speakerSelectInit(param.voice.speaker.label);
  micSliderInit(param.voice.mic.volume * 100);
  speakerSliderInit(param.voice.speaker.volume * 100 * 2);
  testBtnInit();
}

async function micSelectInit(label = null) {
  const micSelect = $('.popup_setting_selectbox[name=mic]', self.popup_setting_wrap);
  const devices = await window.navigator.mediaDevices.enumerateDevices();
  const mics = devices.filter((device) => device.kind === 'audioinput');
  micSelect.html(makeDevicesOption(mics, label));
}

async function speakerSelectInit(label = null) {
  const speakerSelect = $('.popup_setting_selectbox[name=speaker]', self.popup_setting_wrap);
  const devices = await window.navigator.mediaDevices.enumerateDevices();
  const speakers = devices.filter((device) => device.kind === 'audiooutput');
  speakerSelect.html(makeDevicesOption(speakers, label));
}

function micSliderInit(volume = 100) {
  const micSlider = $('.mic_volum', self.popup_setting_wrap);
  micSlider.val(volume);
  setSlider(micSlider, $('.mic_bullet'), volume);
}

function speakerSliderInit(volume = 100) {
  const speakerSlider = $('.speaker_volum', self.popup_setting_wrap);
  speakerSlider.val(volume);
  setSlider(speakerSlider, $('.speaker_bullet'), volume);
}

function testBtnInit() {
  const testBtn = $('.mictest_btn', self.popup_setting_wrap);
  const bar = $('.mic_progress_gradient_wrap', self.popup_setting_wrap);
  testBtn.text('테스트 시작');
  bar.width(`0%`);
  if (micTester) {
    cancelAnimationFrame(micTester);
    micTester = null;
  }
}

async function voiceSettingSave(showMessage = true) {
  // 마이크 목록
  const micSelect = $('.popup_setting_selectbox[name=mic]', self.popup_setting_wrap);
  param.voice.mic.device = micSelect.val();
  param.voice.mic.label = $('option:selected', micSelect).text();

  // 스피커 목록
  const speakerSelect = $('.popup_setting_selectbox[name=speaker]', self.popup_setting_wrap);
  param.voice.speaker.device = speakerSelect.val();
  param.voice.speaker.label = $('option:selected', speakerSelect).text();

  // 입력 볼륨 조절
  const micSlider = $('.mic_volum', self.popup_setting_wrap);
  param.voice.mic.volume = parseInt(micSlider.val()) * 0.01;

  // 수신 볼륨 조절
  const speakerSlider = $('.speaker_volum', self.popup_setting_wrap);
  param.voice.speaker.volume = parseInt(speakerSlider.val()) * 0.01 * 0.5;

  // save value...
  const {
    voice: {
      mic: { device: micDevice, volume: micVolume },
      speaker: { device: speakerDevice, volume: speakerVolume },
    },
  } = param;

  // 마이크 장치
  if (micDevice) {
    const media = await window.navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: micDevice }, noiseSuppression: true, echoCancellation: true },
    });

    replaceTrack({ media, kind: 'voice' });
  }

  // 마이크 입력 크기
  if (micVolume) {
    const media = audioContext.createMediaStreamSource(channel.localStream);
    const gain = audioContext.createGain();
    const destination = audioContext.createMediaStreamDestination();

    gain.gain.value = micVolume;
    media.connect(gain).connect(destination);
    replaceTrack({ media: destination.stream, kind: 'audio' });
  }

  // 스피커 장치
  if (speakerDevice) {
    $('video')
      .toArray()
      .forEach((video) => {
        attachAudioOutput(video, param.voice.speaker.device);
      });
  }

  // 스피커 출력 크기
  $('video').prop('volume', speakerVolume);

  testBtnInit();

  if (showMessage) toastr.success('성공적으로 저장되었습니다.', '음성 설정', { onclick: null });
  // voiceSettingClose();
}

async function voiceSettingReset() {
  await micSelectInit();
  await speakerSelectInit();
  micSliderInit();
  speakerSliderInit();
  testBtnInit();
  await voiceSettingSave(false);
  toastr.success('초기화 되었습니다.', '음성 설정', { onclick: null });
}

function voiceSettingClose() {
  settingWindowClose();
  testBtnInit();
}

/**
 * Video Setting
 */
async function videoSettingInit() {
  settingWindowOpen('video');
  // 설정창 초기화...
  const camWrap = $('.videotest_vod', self.popup_setting_wrap);

  // 카메라 목록
  const camSelect = $('#camera', self.popup_setting_wrap);
  camSelect.off().on('change', async function (e) {
    if ($('video', camWrap).length > 0) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: camSelect.val() } } });
      $('video', camWrap).prop('srcObject', stream);
    }
  });

  const camTestBtn = $('.popup_setting_btn.test_btn', self.popup_setting_wrap);
  camTestBtn.off().on('click', async function (e) {
    camWrap.css('visibility', 'visible');

    const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: camSelect.val() } } });
    camWrap.html($(`<video class="camera_test_vod"/>`));
    $('video', camWrap).prop('srcObject', stream).prop('autoplay', true);
  });

  camSelectInit(param.video.label);
  camTestInit();
  previewCheckboxInit(param.video.previewModal);

  // 영상 설정 저장...
  self.setting_window.video.save.off().on('click', videoSettingSave);

  // 영상 설정 초기화..
  self.setting_window.video.reset.off().on('click', videoSettingReset);

  // 영상 설정 창 닫기..
  self.setting_window.video.close.off().on('click', videoSettingClose);
}

async function camSelectInit(label = null) {
  const camSelect = $('#camera');
  const devices = await window.navigator.mediaDevices.enumerateDevices();
  const cams = devices.filter((device) => device.kind === 'videoinput');
  camSelect.html(makeDevicesOption(cams, label));
}

function previewCheckboxInit(preview = false) {
  $('#modal_set').prop('checked', preview);
}

function camTestInit() {
  const camWrap = $('.videotest_vod', self.popup_setting_wrap);
  let html = ``;
  html += `<ul class="videotest_vod">`;
  html += `<!-- 테스트영상 노출 영역 / 노출시 visibility 속성 변경 -->`;
  html += `<li class="camera_test_vod"></li>`;
  camWrap.css('visibility', 'hidden').html(html);
}

async function videoSettingSave(showMessage = true) {
  // 카메라 장치
  const camSelect = $('#camera', self.popup_setting_wrap);
  param.video.device = camSelect.val();
  param.video.label = $('option:selected', camSelect).text();

  const {
    video: { device, previewModal },
  } = param;

  // 카메라 장치 선택
  if (device) {
    const media = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device } } });

    replaceTrack({ media, kind: 'video' });
  }

  // 영상 항상 미리보기
  const previewCheckbox = $('#modal_set');
  param.video.previewModal = previewCheckbox.prop('checked');

  if (showMessage) toastr.success('성공적으로 저장되었습니다.', '영상 설정', { onclick: null });
}

async function videoSettingReset() {
  await camSelectInit();
  camTestInit();
  previewCheckboxInit();
  await videoSettingSave(false);
  toastr.success('초기화 되었습니다.', '영상 설정', { onclick: null });
}

function videoSettingClose() {
  settingWindowClose();
  camTestInit();
}

/**
 * Background Setting
 */
function backgroundSettingInit() {
  settingWindowOpen('background');
  const selectImg = $('.setting_bg_list_wrap .setting_bg_list', self.popup_setting_wrap);
  selectImg.off().on('click', function (e) {
    // 기존 선택된 아이템 제거
    selectImg.removeClass('active');

    // 새 아이템 선택
    const li = $(e.currentTarget);
    li.addClass('active');
  });

  const custom = $('.bg_custom', selectImg);
  custom
    .parent()
    .off()
    .on('click', function () {
      const input = document.createElement('input');

      input.type = 'file';
      input.accept = '.png, .jpg, .jpeg, .webp'; // 확장자 가이드를 할 경우 .png,.jpg 등 입력
      input.click();

      $(input)
        .off()
        .on('change', async (e) => {
          const [file] = e.target.files;
          const blob = new Blob([new Uint8Array(await file.arrayBuffer())], { type: file.type });
          const url = window.URL.createObjectURL(blob);
          custom.html(`<img src="${url}" hidden />`);
          custom.css('background-image', `url("${url}")`);
        });
    });

  backgroundSelectInit(param.background.img);

  // 배경 설정 저장...
  self.setting_window.background.save.off().on('click', backgroundSettingSave);

  // 배경 설정 초기화..
  self.setting_window.background.reset.off().on('click', backgroundSettingReset);

  // 배경 설정 창 닫기..
  self.setting_window.background.close.off().on('click', backgroundSettingClose);
}

function backgroundSelectInit(selectedImg = undefined) {
  // 기존 선택된 아이템 제거
  const imgs = $('.setting_bg_list_wrap .setting_bg_list', self.popup_setting_wrap);
  imgs.removeClass('active');
  if (!selectedImg) {
    // 없으면 배경 없음을 선택
    const bgNone = $('.setting_bg_list_wrap .setting_bg_list .bg_none', self.popup_setting_wrap).parent().parent();
    bgNone.addClass('active');
  } else {
    // 있으면 해당 이미지를 선택
    $.each(imgs, function (i, li) {
      // 입력한 값이 이미지 소스인 경우
      if ($('img', li).attr('src') === selectedImg) return $(li).addClass('active');
      // 입력한 값이 배경없음|흐리게|사용자지정의 클래스 이름인 경우
      if ($('.bg_list_txt > div', li).hasClass(selectedImg)) return $(li).addClass('active');
    });
  }
}

async function backgroundSettingSave(showMessage = true) {
  if (!channel.localStream.getVideoTracks().length) {
    return webrtc.toastPopup('먼저 카메라를 켜 주세요.');
  }

  // 선택한 배경 이미지
  const selectImg = $('.setting_bg_list_wrap .setting_bg_list.active', self.popup_setting_wrap);

  if ($('.bg_list_txt', selectImg).length > 0) {
    // 배경없음|흐리게|사용자 지정
    if ($('.bg_list_txt img', selectImg).length > 0) {
      // 사용자 지정
      param.background.img = $('.bg_list_txt .bg_custom img', selectImg).attr('src');
    } else {
      // 배경없음|흐리게
      param.background.img = $('.bg_list_txt > div', selectImg).attr('class');
    }
  } else if ($('.bg_list_img', selectImg).length > 0) {
    // 프리셋 이미지
    param.background.img = $('.bg_list_img img', selectImg).attr('src');
  } else {
    // 선택 없음
    param.background.img = null;
    return webrtc.toastPopup('먼저 옵션을 선택해주세요.');
  }

  /**
   * change background
   */

  const {
    background: { img },
  } = param;

  const ctx = rtcCanvas.getContext('2d');

  videoElement.width = CONSTRAINTS.video.width.ideal;
  videoElement.height = CONSTRAINTS.video.height.ideal;
  rtcCanvas.width = CONSTRAINTS.video.width.ideal;
  rtcCanvas.height = CONSTRAINTS.video.height.ideal;

  if (showMessage) toastr.success('성공적으로 저장되었습니다.', '배경 설정', { onclick: null });

  if (img?.startsWith('http') || img?.startsWith('blob') || img?.startsWith('.')) {
    // 사용자 지정 이미지일 때
    replaceBackground(videoElement, { type: 'bg_custom', img });
  } else {
    replaceBackground(videoElement, { type: img });
  }

  async function replaceBackground(videoElement, { type, img }) {
    let exit = false;

    if (bgRenderer) {
      cancelAnimationFrame(bgRenderer);
      clearInterval(bgRenderer);
      bgRenderer = null;
    }

    videoElement.srcObject = await window.navigator.mediaDevices.getUserMedia(makeConstraints());
    videoElement.play();

    switch (type) {
      case 'bg_none':
        exit = true;
        replaceTrack({ media: videoElement.srcObject, kind: 'video' });
        break;
      case 'bg_blur':
        setTimeout(() => {
          perform(net, type, img).then(() => {
            const blurMedia = rtcCanvas.captureStream(30);
            replaceTrack({ media: blurMedia, kind: 'video' });
            if (bgRenderer) clearInterval(bgRenderer);
            bgRenderer = setInterval(() => {
              perform(net, type, img);
            }, 1000 / 30);
          });
        }, 500);
        break;
      default:
        if (img.toLowerCase().startsWith('http') || img.toLowerCase().startsWith('blob') || img.toLowerCase().startsWith('.')) {
          const imgData = await (await fetch(img)).blob();
          const url = window.URL.createObjectURL(imgData);
          const newImg = document.createElement('img');
          newImg.src = url;
          setTimeout(() => {
            perform(net, 'bg_custom', newImg).then(() => {
              const customBgMedia = rtcCanvas.captureStream(30);
              replaceTrack({ media: customBgMedia, kind: 'video' });
              window.URL.revokeObjectURL(url);
              if (bgRenderer) clearInterval(bgRenderer);
              bgRenderer = setInterval(() => {
                perform(net, 'bg_custom', newImg);
              }, 1000 / 30);
            });
          }, 500);
        }
        break;
    }

    if (exit) return;

    async function perform(net, type, imgElement) {
      const segmentation = await net.segmentPerson(videoElement, {
        flipHorizontal: false,
        // internalResolution: 'low'|'midium'|'high'|positive number - 해상도를 높일 경우, 컴퓨터 사양에 따라 조절이 필요할 수 있음
        internalResolution: 'high',
        segmentationThreshold: 0.7,
      });

      if (type === 'bg_blur') {
        const backgroundBlurAmount = 6;
        const edgeBlurAmount = 6;
        const flipHorizontal = false;

        bodyPix.drawBokehEffect(rtcCanvas, videoElement, segmentation, backgroundBlurAmount, edgeBlurAmount, flipHorizontal);
      } else {
        const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
        const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
        const backgroundDarkeningMask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor, false);

        if (!backgroundDarkeningMask) return;

        // 마스크 된 소스 (투명/검은색으로 나눠진 화면)
        ctx.globalCompositeOperation = 'destination-over';
        ctx.putImageData(backgroundDarkeningMask, 0, 0);

        // 마스크 위에 기존 스트림 쌓기 (기존 소스를 가져와서 검은색 부분에 덮음)
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(videoElement, 0, 0, rtcCanvas.width, rtcCanvas.height);

        // 현재 있는 데이터 아래에 선택한 배경 이미지 넣기 (현재 있는 데이터 아래에 새 데이터 삽입)
        ctx.globalCompositeOperation = 'destination-atop';
        ctx.drawImage(imgElement, 0, 0, rtcCanvas.width, rtcCanvas.height);
      }
    }
  }
}

async function backgroundSettingReset() {
  backgroundSelectInit();
  await backgroundSettingSave(false);
  toastr.success('초기화 되었습니다.', '배경 설정', { onclick: null });
}

function backgroundSettingClose() {
  settingWindowClose();
}

/**
 * 공통으로 사용하는 함수
 */

/**
 *
 * @param {"voice"|"video"|"background"} target
 */
function settingWindowOpen(target) {
  settingWindowClose();
  self.popup_setting_dim.css('visibility', 'visible');
  self.setting_window[target]?.wrap.addClass('active');
}

// 설정 창 닫기
function settingWindowClose() {
  self.popup_setting_dim.css('visibility', 'hidden');
  self.popup_setting_wrap.removeClass('active');
}

// 슬라이더 디자인 설정
function setSlider(slider, bullet, value) {
  var bulletPosition = value || slider.value / slider.max;
  bullet.text(value || slider.value);
  bullet.css({ left: bulletPosition * 290 + 'px' });
  var left = '#2bc48a';
  var right = '#454545';
  var val = $(slider).val() / ($(slider).attr('max') / 100);
  $(slider).css('background', `linear-gradient(to right, ${left} 0%, ${left} ${val}%, ${right} ${val}%, ${right} 100%)`);
}

// 디바이스 목록 => 옵션으로 만들기
function makeDevicesOption(devices, currentDeviceId) {
  let html = '';
  devices.forEach((device) => {
    html += `<option value="${device.deviceId}" ${currentDeviceId === device.label ? 'selected' : ''}>${device.label}</option>`;
  });
  return html;
}

// 채널이 가지고 있는 로컬 스트림에 트랙 변경
function replaceTrack(option) {
  const { media, track, kind } = option;
  const [localAudioTrack] = channel.localStream.getAudioTracks();
  const [localVideoTrack] = channel.localStream.getVideoTracks();

  if (media && kind) {
    setTimeout(() => {
      if (kind === 'voice') {
        if (localAudioTrack) channel.localStream.removeTrack(localAudioTrack);
        const [track] = media.getAudioTracks();
        track.applyConstraints({ echoCancellation: true, noiseSuppression: true });
        channel.localStream.addTrack(track);
      }
      if (kind === 'video') {
        if (localVideoTrack) channel.localStream.removeTrack(localVideoTrack);
        const [track] = media.getVideoTracks();
        channel.localStream.addTrack(track);
      }
    }, 1000);
  } else if (track && kind) {
    if (kind === 'voice') {
      if (localAudioTrack) channel.localStream.removeTrack(localAudioTrack);
      track.applyConstraints({ echoCancellation: true, noiseSuppression: true });
      channel.localStream.addTrack(track);
    }
    if (kind === 'video') {
      if (localVideoTrack) channel.localStream.removeTrack(localVideoTrack);
      channel.localStream.addTrack(track);
    }
  } else {
    throw new Error('media나 track, kind에 올바른 값을 입력해주세요.');
  }
}

// constraints 값 반환
function makeConstraints() {
  return {
    video: param.video.device ? { deviceId: { exact: param.video.device } } : true,
    audio: param.voice.mic.device
      ? { deviceId: { exact: param.voice.mic.device }, noiseSuppression: true, echoCancellation: true }
      : { noiseSuppression: true, echoCancellation: true },
  };
}

// 특정 Element의 소리 출력 장치를 바꿈
function attachAudioOutput(element, deviceId) {
  if (typeof element.sinkId !== 'undefined') {
    element.setSinkId(deviceId).catch((error) => {
      let errorMessage = error;
      if (error.name === 'SecurityError') {
        errorMessage = `보안상 HTTPS를 사용하지 않으면 오디오 출력장치를 선택할 수 없습니다.: ${error}`;
      }
      console.error(errorMessage);
    });
  } else {
    console.warn('오디오 출력장치 변경을 지원하지 않는 브라우저입니다.');
  }
}

/**
 * rtcRemoteStreamAppend 시 마다 해줘야 하는 것 들
 */
function remoteStreamAppendForSetting() {
  $('video')
    .toArray()
    .forEach((video) => {
      if (param.voice.speaker.device) attachAudioOutput(video, param.voice.speaker.device);
      video.volume = param.voice.speaker.volume;
    });
}

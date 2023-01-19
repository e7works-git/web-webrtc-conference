class FileUtil {
  /**
   * 필수
   * uploadUrl        : 업로드 url
   * downloadUrl      : 다운로드 url
   * updateEvent      : 업데이트 이벤트
   * uploadTag        : 업로드 클릭 태그
   *
   * 옵션
   * uploadDragTag    : 업로드 드래그 & 드롭 태그
   * progressTag      : 프로그래스 태그
   */
  constructor(arg) {
    this.progressFlag = false;
    this.initCheck(arg);
  }

  // 실행 가능한 환경인지 체크
  initCheck = (data, callback) => {
    if (data) {
      if (!data.uploadUrl) {
        console.error('fileUtil', '업로드 URL 이 정의되지 않았습니다.');
      } else if (!data.downloadUrl) {
        console.error('fileUtil', '다운로드 URL 이 정의되지 않았습니다.');
      } else if (!data.updateEvent) {
        console.error('fileUtil', '업로드 이벤트 가 정의되지 않았습니다.');
      } else if (!data.uploadTag) {
        console.error('fileUtil', '업로드 Tag 가 정의되지 않았습니다.');
      } else {
        this.upload_url = data.uploadUrl;
        this.download_url = data.downloadUrl;
        this.update = data.updateEvent;
        this.init(data.uploadTag);

        // option
        if (data.uploadDragTag) {
          this.dragInit(data.uploadDragTag);
        }
        if (data.progressTag) {
          this.progressSize = data.progressSize;
          this.progressEvent = data.progressEvent;
          this.progressInit(data.progressTag);
        }
      }
    } else {
      console.error('fileUtil', '기본설정이 정의되지 않았습니다.');
    }
  };

  // 업데이트
  update = () => {};

  // 프로그래스
  progressEvent = () => {};

  // 기본 Init
  init = (targetTag) => {
    let uploadFile = this.uploadFile;
    this.addCustomStyle(
      '.e7works_file-down-wrap { margin-left: 25px; width: 200px; box-sizing: border-box; box-shadow: 3px 3px 5px rgb(0 0 0 / 5%); border: 1px solid #efefef; border-radius: 7px; font-size: 11px; color: #ababab; padding: 13px;} .e7works_file-down-subwrap { display: flex; flex-direction: row; align-items: flex-start; } .e7works_file-name { max-width: 120px; max-height: 45px; overflow: hidden; text-overflow: ellipsis;  font-size: 12px; color: #333; line-height: 1.2; margin-bottom: 7px; word-break: break-all; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;} .e7works_file-img { width: 40px; height: 40px; display: flex; justify-content: space-around; padding: 10px; border-radius: 20px; border: 1px solid #dedede; box-sizing: border-box; margin-left: 10px;} .e7works_file-img i{ font-size: 20px; color: #999;} .e7works_file-save { text-decoration: none; color: #000; font-size: 12px; margin-top: 7px; display: block; cursor: pointer; width: 23px; } .e7works_file-save:hover { text-decoration: underline; color: #000;}'
    );

    $(targetTag)
      .off('click')
      .on('click', function () {
        let input = document.createElement('input');

        input.type = 'file';
        input.accept = '*.*'; // 확장자 가이드를 할 경우 .png,.jpg 등 입력
        input.click();

        input.onchange = (e) => {
          uploadFile(e.target.files[0]);
        };
      });
  };

  // 드래그 Init
  dragInit = (targetTag) => {
    this.addCustomStyle(
      '.is-dragover { width: 100%; height: 100%; outline: 2px dashed #92b0b3; background: #c8dadf !important; outline-offset: -10px;} .dragover_transition { transition: outline-offset .15s ease-in-out, all .15s;}'
    );
    let uploadFile = this.uploadFile;

    $(document)
      .on('drag dragstart dragend dragover dragenter dragleave drop', targetTag, function (e) {
        e.preventDefault();
        // 이벤트 전파 사용/비사용
        // e.stopPropagation();
      })
      .on('dragenter', function (e) {
        let dropField = $('#dropField');
        if (!dropField[0]) {
          $(targetTag)
            .addClass('dragover_transition')
            .prepend(
              $('<div id="dropField"></div>')
                .css({ position: 'absolute', width: '100%', height: '100%' })
                .on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
                  e.preventDefault();
                  e.stopPropagation();
                })
                .on('dragenter', function (e) {
                  $(targetTag).addClass('is-dragover');
                })
                .on('dragleave drop', function (e) {
                  $('#dropField').remove();
                  $(targetTag).removeClass('is-dragover');
                })
                .on('drop', function (e) {
                  const dt = e.originalEvent.dataTransfer;
                  const files = dt.files;
                  for (let i = 0; i < files.length; i++) {
                    uploadFile(files[i]);
                  }
                  $('#dropField').remove();
                })
            );
        }
      });
  };

  // 프로그래스 Init
  progressInit = (targetTag) => {
    let size = 120;
    if (this.progressSize) {
      size = this.progressSize;
    }
    let RADIUS = size / 2;
    // display: none;
    this.addCustomStyle(
      `.e7works_circle_progress_wrap { display:none; position: relative; width: ${size}px; height: ${size}px; margin: auto; } .e7works_circle_progress { background-color: #fff; border-radius: 60px; transform: rotate(-90deg); } .e7works_progress_frame, .e7works_progress_bar { fill: none; } .e7works_progress_frame { stroke: #e6e6e6; } .e7works_progress_bar { stroke: #2bc48a; stroke-linecap: round; } .e7works_progress_value { position: absolute; left: 0; right: 0; bottom: 0; top: 0; text-align: center; color: #888; font-size: ${
        size / 4
      }px; line-height: ${size}px; }`
    );

    this.progressFlag = true;

    $(targetTag).append(
      $(`
            <!-- 프로그래스 바 -->
            <div class="e7works_circle_progress_wrap">
                <svg class="e7works_circle_progress" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <circle class="e7works_progress_frame" cx="${size / 2}" cy="${size / 2}" r="${RADIUS}" stroke-width="${size / 7}" />
                    <circle class="e7works_progress_bar" cx="${size / 2}" cy="${size / 2}" r="${RADIUS}" stroke-width="${size / 7}" />
                </svg>
                <strong class="e7works_progress_value">0%</strong>
            </div>
        `)
    );

    this.bar = document.querySelector('.e7works_progress_bar');
    this.value = document.querySelector('.e7works_progress_value');
    this.circumference = 2 * Math.PI * RADIUS;
    this.bar.style.strokeDasharray = this.circumference;
  };

  // 파일 전송
  uploadFile = (file) => {
    webrtc.alert_popup({
      title: '업로드 중 입니다.',
      msg: '업로드 중 입니다. 잠시만 기다려 주십시오.',
    });
    let url = this.upload_url,
      progressBar = this.progressBar,
      update = this.update,
      progressFlag = this.progressFlag;
    var formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', channel.roomId);
    $.ajax({
      url: url,
      type: 'POST',
      data: formData,
      contentType: false,
      processData: false,
      enctype: 'multipart/form-data',
      xhr: function () {
        var xhr = $.ajaxSettings.xhr();
        xhr.upload.onprogress = function (e) {
          var per = (e.loaded * 100) / e.total;
          progressBar(per);
        };
        return xhr;
      },
      success: function (res) {
        update(true, res);
      },
      error: function (e) {
        console.log('upload error >>>>', e, progressFlag);
        if (progressFlag) {
          progressBar(100);
        }
        update(false, e);
      },
      complete: function () {
        if (progressFlag) {
          $('.e7works_progressContainer').hide();
          $('.e7works_progressNow').css('width', 'calc(0%)');
        }
      },
    });
  };

  // 프로그래스
  progressBar = (per) => {
    console.log('progress event !!! >>', per);
    if (this.progressFlag) {
      per = per.toFixed(1);
      if (per >= 100) {
        $('.e7works_circle_progress_wrap').hide();
        this.value.innerHTML = '0%';
        this.bar.style.strokeDashoffset = 0;
      } else {
        var progress = per / 100;
        var dashoffset = this.circumference * (1 - progress);

        this.value.innerHTML = per + '%';
        this.bar.style.strokeDashoffset = dashoffset;
        $('.e7works_circle_progress_wrap').show();
        this.progressEvent();
      }
    }
  };

  // 커스텀 스타일
  addCustomStyle = (html) => {
    // 커스텀 스타일
    var style = document.createElement('style');
    style.innerHTML = html;
    document.getElementsByTagName('head')[0].appendChild(style);
  };

  fileInTag = (name, type, date, size, fileKey) => {
    let download_url = this.download_url;
    let icon = this.fileExeCheck(type.toUpperCase());

    let html = $(`
            <div class="e7works_file-down-wrap">
                <div class="e7works_file-down-subwrap">
                    <div class="e7works_file-contents">
                        <div class="e7works_file-name">${name ? name : ''}</div>
                        <div class="e7works_file-down-date">유효기간 : <span>${date ? date : ''}</span></div>
                        <div class="e7works_file-size">용량 : <span>${size ? (size / 1024 / 1024).toFixed(2) + ' MB' : ''}</span></div>
                    </div>
                    <div class="e7works_file-img"><i class="${icon}"></i></div>
                </div>
                <div class="e7works_file-save">저장</div>
            </div>
        `);

    $('div.e7works_file-save', html).on('click', function (e) {
      const link = document.createElement('a');
      link.href = download_url + '?fileKey=' + fileKey;
      link.click();
    });
    return html;
  };

  fileExeCheck(type) {
    let res = 'fa-regular fa-paste';
    if (this.forCheck(type, ['pdf'])) {
      res = 'fa-solid fa-file-pdf';
    } else if (this.forCheck(type, ['xlsx', 'xls'])) {
      res = 'fa-solid fa-file-excel';
    } else if (this.forCheck(type, ['csv'])) {
      res = 'fa-solid fa-file-csv';
    } else if (this.forCheck(type, ['doc', 'docx', 'hwp'])) {
      res = 'fa-solid fa-file-word';
    } else if (this.forCheck(type, ['mp4', 'avi', 'wmv', 'mpg', 'mpeg', 'mkv', 'mov'])) {
      res = 'fa-solid fa-video';
    } else if (this.forCheck(type, ['mp3', 'wav'])) {
      res = 'fa-solid fa-music';
    } else if (this.forCheck(type, ['zip', '7z', 'tar', 'gz'])) {
      res = 'fa-solid fa-file-zipper';
    } else if (this.forCheck(type, ['txt', 'text'])) {
      res = 'fa-solid fa-file-lines';
    } else if (this.forCheck(type, ['xml'])) {
      res = 'fa-solid fa-file-code';
    }

    return res;
  }

  forCheck(item, list) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].toUpperCase() == item.toUpperCase()) {
        return true;
      }
    }
    return false;
  }

  loadCheck = (obj) => {
    let imgList = ['png', 'jpg', 'jpge', 'bmp', 'tiff', 'gif', 'webp'];
    let audioList = ['mp3', 'wav'];
    let action = true;

    // 이미지 체크
    for (let i = 0; i < imgList.length; i++) {
      if (imgList[i].toUpperCase() == obj.exe.toUpperCase()) {
        action = false;
        obj.imgLoad(obj.key);
      }
    }

    // 동영상 체크
    if (action) {
      if ('mp4'.toUpperCase() == obj.exe.toUpperCase()) {
        action = false;
        obj.vodLoad(obj.key);
      }
    }

    // 오디오 체크
    if (action) {
      for (let i = 0; i < audioList.length; i++) {
        if (audioList[i].toUpperCase() == obj.exe.toUpperCase()) {
          action = false;
          obj.audioLoad(obj.key);
        }
      }
    }

    // 일반 파일
    if (action) {
      obj.fileLoad(obj.data);
    }
  };

  imgLoad = (key, onload, error) => {
    var _img = new Image();
    var button = document.createElement('div');
    var url = this.download_url + '?fileKey=' + key;

    button.innerText = '저장';
    button.className = 'e7works_file-save';
    button.addEventListener('click', function () {
      const link = document.createElement('a');
      link.href = url;
      link.click();
    });

    _img.onload = function (e) {
      onload(_img, button);
    };
    _img.onerror = function (e) {
      error(e);
    };
    _img.src = url;
  };

  vodLoad = (key, onload) => {
    var video = document.createElement('video');
    var button = document.createElement('div');
    var url = this.download_url + '?fileKey=' + key;
    video.src = url;
    video.setAttribute('controls', 'true');

    button.innerText = '저장';
    button.className = 'e7works_file-save';
    button.addEventListener('click', function () {
      const link = document.createElement('a');
      link.href = url;
      link.click();
    });

    onload(video, button);
  };

  aodLoad = (key, onload) => {
    var audio = document.createElement('audio');
    var button = document.createElement('div');
    var url = this.download_url + '?fileKey=' + key;
    audio.src = url;
    audio.setAttribute('controls', 'true');

    button.innerText = '저장';
    button.className = 'e7works_file-save';
    button.addEventListener('click', function () {
      const link = document.createElement('a');
      link.href = url;
      link.click();
    });

    onload(audio, button);
  };
}

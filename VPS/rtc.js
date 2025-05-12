let localStream = null;
let fileSelected = false;

// ファイル選択イベント
const fileInput = document.getElementById('fileInput');
const videoElm = document.getElementById('my-video');
const errorMessage = document.getElementById('errorMessage');

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('video/')) {
    const videoURL = URL.createObjectURL(file);
    videoElm.src = videoURL;
    videoElm.load();
    fileSelected = true;
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  } else {
    fileSelected = false;
    errorMessage.textContent = '動画ファイルを選択してください。';
    errorMessage.style.display = 'block';
    videoElm.src = '';
  }
});

// Peer作成
const peer = new Peer({
  key: 'd60cc56b-3de6-4412-be61-003bd3c45d3b',
  debug: 3
});

// PeerID取得
peer.on('open', () => {
  document.getElementById('my-id').textContent = peer.id;
});

// 発信処理
let mediaConnection = null;
document.getElementById('make-call').onclick = async () => {
  if (!fileSelected) {
    errorMessage.textContent = '先に動画ファイルを選択してください。';
    errorMessage.style.display = 'block';
    return;
  }
  // video再生開始
  await videoElm.play();
  // videoからMediaStream取得
  if (videoElm.captureStream) {
    localStream = videoElm.captureStream();
  } else if (videoElm.mozCaptureStream) {
    localStream = videoElm.mozCaptureStream();
  } else {
    errorMessage.textContent = 'このブラウザは動画ストリーム送信に対応していません。';
    errorMessage.style.display = 'block';
    return;
  }
  const theirID = document.getElementById('their-id').value;
  const mediaConnection = peer.call(theirID, localStream, {videoCodec: 'H264'});
  setEventListener(mediaConnection);
};

// イベントリスナを設置する関数
const setEventListener = mediaConnection => {
  mediaConnection.on('stream', stream => {
    // video要素にカメラ映像をセットして再生
    const videoElm = document.getElementById('their-video')
    videoElm.srcObject = stream;
    videoElm.play();
  });
}

// 着信処理
peer.on('call', mediaConnection => {
  // 受信側は従来通りlocalStreamを返す（ここでは動画ファイルのストリーム）
  mediaConnection.answer(localStream, {videoCodec: 'H264'});
  setEventListener(mediaConnection);
});

// 切断処理
// mediaConnectionがnullの場合のガードも追加

document.getElementById('end-call').onclick = () => {
  if (mediaConnection) {
    console.log("切断")
    mediaConnection.close();
  }
}

// 接続が切れたときに発火
peer.on('close', function(){
  if (mediaConnection) {
    mediaConnection.close();
  }
});
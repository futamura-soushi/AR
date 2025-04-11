var position, rotation;
var x, y, z;  //カメラの位置
var a, b, c; //カメラの角度（クォータニオン）
var json = {
  "UnityPosition" : [x, y, z],
  "UnityRotation" : [a, b, c]
};

var prevjson = {
    "UnityPosition" : [x, y, z],
    "UnityRotation" : [a, b, c]
  };

var test = 0
const camerawidth = 1280;
const cameraheight = 720;

let localStream;

// カメラ映像取得
document.addEventListener('DOMContentLoaded', () => {
  const videoElement = document.getElementById('my-video');

  navigator.mediaDevices.getUserMedia({ video: { 
    width: camerawidth,
    height: cameraheight,
    facingMode: 'environment' } })
      .then(stream => {
          videoElement.srcObject = stream;
          videoElement.play();
          localStream = stream
      })
      .catch(error => {
          console.error('Error accessing rear camera:', error);
      });
});

    //Peer作成
    const peer = new Peer({
      key: 'd60cc56b-3de6-4412-be61-003bd3c45d3b',
      debug: 3
  });

  //PeerID取得
  peer.on('open', () => {
      document.getElementById('my-id').textContent = peer.id;
  });

  // 発信処理
document.getElementById('make-call').onclick = () => {
  const theirID = document.getElementById('their-id').value;
  const mediaConnection = peer.call(theirID, localStream, {videoCodec: 'H264'});
  setEventListener(mediaConnection);

  // 相手への接続を開始する
  const conn = peer.connect(theirID);

  // 接続が完了した場合のイベントの設定
  conn.on("open", function() {
      timer1 = setInterval(sendInfo, 100);
  });

    // 指定時間ごとに繰り返し実行される setInterval(実行する内容, 間隔[ms]) タイマーを設定
  function sendInfo(){
    if (test){
        conn.send(JSON.stringify(json));
    }
    }

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

//着信処理
peer.on('call', mediaConnection => {
  mediaConnection.answer(localStream, {videoCodec: 'H264'});
  setEventListener(mediaConnection);
});

//切断処理
document.getElementById('end-call').onclick = () => {
  console.log("切断")
  mediaConnection.close(true);
}

//接続が切れたときに発火
peer.on('close', function(){
  mediaConnection.close(true);
});

   // 処理登録
AFRAME.registerComponent('marker-position', {
    init: function () {

        var marker = this.el;

        setInterval(() => {
            //Marker 検知状態の確認
            if (marker.object3D.visible) {
              // Marker 座標の取得(x:画像の縦(右が+), y:画像の横(上が＋), z:画像の奥行（近づくほど＋）)相対座標
              Markerposition = marker.object3D.position;
              Markerrotation = marker.object3D.rotation;
              
              // Unityに送る形式に変換
              json.UnityPosition =[Markerposition.x, Markerposition.y, -Markerposition.z];
              json.UnityRotation = [-Markerrotation.x * 180/Math.PI, -Markerrotation.y * 180/Math.PI, Markerrotation.z * 180/Math.PI];
              
              console.log("Unity座標系のマーカ位置:", json.UnityPosition);
              console.log("Unity座標系のマーカ回転:", json.UnityRotation);
              test = 1;
              console.log(test);
            }else{
              test = 0;
            }     
    }, 100);
    }
});

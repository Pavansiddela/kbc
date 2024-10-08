import React from "react";
import { liveurl } from "../lib/data";
import { QRCodeSVG } from "qrcode.react";

const QRCodeCard = () => {
  return (
    <div className="h-[300px] w-[300px] py-4 mt-4 bg-white rounded-md shadow-sm flex flex-col  items-center relative">
      <div className="text-xl  font-bold ">QR Code</div>
      <div className="text-md   text-gray-500/80 mb-7">
        Join Through Your Mobile
      </div>
      <QRCodeSVG value={liveurl} />
    </div>
  );
};

export default QRCodeCard;

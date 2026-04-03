# Crowd Pulse

Crowd Pulse is a real-time monitor and simulation tool that integrates computer vision (YOLOv8) with hardware sensors (Piezo/Arduino) to detect and manage crowd density. It is designed to calculate stampede risk and provide actionable alerts through a live Next.js dashboard.

## Features

- **Live Crowd Monitoring**: Real-time integration with standard cameras using YOLOv8 object detection to track the number of individuals.
- **Hardware Sensor Fusion**: Integrates Piezo pressure sensors via Serial (Arduino) to measure ground pressure and detect high-energy movements.
- **Simulation Mode**: Includes interactive simulations (Normal, Running, Stampede) to visualize crowd flow and high-pressure zones on a web grid.
- **Risk Calculation**: Intelligently fuses camera data and ground pressure data to determine risk of crush or stampede conditions.

## Tech Stack

- **Frontend**: Next.js 16 (React 19), Tailwind CSS, Recharts, and Radix UI components.
- **Backend / AI Processing**: Python, Flask, OpenCV, Ultralytics (YOLOv8), PySerial.

## Getting Started

### 1. Start the Frontend Dashboard

Ensure you have Node.js installed. Open a terminal in the project directory:

```bash
# Install dependencies (use --legacy-peer-deps to avoid React peer conflicts)
npm install --legacy-peer-deps

# Start the Next.js development server
npm run dev
```

The frontend interface will open and be accessible at **`http://localhost:3005`**.

### 2. Start the AI Background Worker & Backend

Ensure you have Python installed. You will need a webcam and optionally an Arduino connected via COM port (defaults to `COM7`). Open a separate terminal:

```bash
# Install Python dependencies
pip install flask opencv-python ultralytics pyserial numpy pandas scikit-learn joblib

# Start the backend Python worker
python app_fixed.py
```

The Flask API will run on **`http://localhost:5001`**.

## Important Configuration

- **Arduino/Serial Port**: If you are using physical sensors, make sure to change `SERIAL_PORT = 'COM7'` at the top of `app_fixed.py` to match the active COM port on Windows (or `/dev/tty...` on Mac/Linux).
- **Camera Selection**: The Python script tries to open the default camera `cv2.VideoCapture(0)`. If you are using an external camera, you may need to update the camera index.
- **Simulations**: Check out `hooks/use-simulation.ts` to see how the mathematical flow behaviors for the stampede simulation are driven.

## Troubleshooting

- **YOLOv8 Weights**: `yolov8n.pt` is bundled in the directory, so you do not need to train the model yourself.
- **Dependency Issues**: If `npm install` gives `ERESOLVE` errors, force standard compatibility by appending `--legacy-peer-deps`.

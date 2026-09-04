<div align="center">

![What are you looking at](./media/WeChatd55bd9f85862a4d2bcf7e8c3c6aaf566.jpg "width=50%")

</div>

Model: [SmolVLA 450M](https://github.com/huggingface/lerobot?utm_source=chatgpt.com)

Framework: Huggingface LeRobot

Simulation: directly simulate the robotic arm with Python

Dataset: Generate expert trajectories using inverse kinematics algorithm -> convert to LeRobot dataset
- Action: "[angle, angle]"
- Language: "Move to the cursor"

Training: SmolVLA fine-tuning
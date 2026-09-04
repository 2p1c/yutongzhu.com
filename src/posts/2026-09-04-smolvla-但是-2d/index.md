<div align="center">

![你在看什么](./media/WeChatd55bd9f85862a4d2bcf7e8c3c6aaf566.jpg "width=50%")

</div>

模型：[SmolVLA 450M](https://github.com/huggingface/lerobot?utm_source=chatgpt.com) 

框架：Huggingface LeRobot

仿真：直接用python仿真机械臂

数据集：用逆运动学算法生成专家轨迹 -> 转换成LeRobot dataset
- Action:"[角度， 角度]"
- Language:"Move to the cursor"

训练：SmolVLA fine-tuning





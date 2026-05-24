from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
import os

app = FastAPI()

# 1. 创建一个叫 "uploaded_images" 的文件夹，用来存用户传上来的图片
UPLOAD_DIR = "uploaded_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# 2. 【核心接口】：图片上传
@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # 获取图片原本的名字（比如 my_photo.jpg）
    file_name = file.filename

    # 拼接出图片在电脑里的保存路径（比如：uploaded_images/my_photo.jpg）
    file_path = os.path.join(UPLOAD_DIR, file_name)

    # 读取用户传过来的文件内容，并写入到我们本地的文件中
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # 告诉前端，上传成功了，并把图片的路径和名字返回过去
    return {
        "message": "图片上传成功！",
        "file_name": file_name,
        "file_path": file_path
    }


# 3. 【核心接口】：图片读取（查看图片）
@app.get("/images/{file_name}")
async def get_image(file_name: str):
    # 找到图片在本地的路径
    file_path = os.path.join(UPLOAD_DIR, file_name)

    # 检查这个图片是否存在，存在就返回给前端（或者浏览器直接显示）
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "找不到这张图片"}
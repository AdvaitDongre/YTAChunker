from utils.folder_monitor import check_temp_folder_size, clean_temp_folder
import os

# Add this near your other configuration variables
TEMP_FOLDER = os.path.join(os.path.dirname(__file__), "temp")
SIZE_LIMIT_GB = 1

@app.post("/process-video")
async def process_video(url: str):
    try:
        # Check temp folder size before processing
        is_exceeded, current_size = check_temp_folder_size(TEMP_FOLDER, SIZE_LIMIT_GB)
        if is_exceeded:
            # Clean up and return error
            clean_temp_folder(TEMP_FOLDER)
            return JSONResponse(
                status_code=507,  # Insufficient Storage
                content={
                    "error": f"Temp folder size ({current_size:.2f}GB) exceeded limit of {SIZE_LIMIT_GB}GB. Processing terminated."
                }
            )

        # Your existing video processing code here
        # ...

        # Add size checks after major operations
        is_exceeded, current_size = check_temp_folder_size(TEMP_FOLDER, SIZE_LIMIT_GB)
        if is_exceeded:
            clean_temp_folder(TEMP_FOLDER)
            return JSONResponse(
                status_code=507,
                content={
                    "error": f"Temp folder size ({current_size:.2f}GB) exceeded limit of {SIZE_LIMIT_GB}GB during processing. Operation terminated."
                }
            )

        # Continue with your existing code
        # ...

    except Exception as e:
        # Clean temp folder on error
        clean_temp_folder(TEMP_FOLDER)
        raise e

    finally:
        # Optional: Clean specific video files after processing
        # Remove only the processed video's temporary files
        pass 
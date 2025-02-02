import os
import shutil
from pathlib import Path

def get_folder_size(folder_path):
    """Calculate total size of a folder in bytes"""
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(folder_path):
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            total_size += os.path.getsize(file_path)
    return total_size

def check_temp_folder_size(temp_folder_path, size_limit_gb=1):
    """
    Check if temp folder size exceeds limit
    Returns: (bool, float) - (whether limit exceeded, current size in GB)
    """
    size_limit_bytes = size_limit_gb * 1024 * 1024 * 1024  # Convert GB to bytes
    current_size = get_folder_size(temp_folder_path)
    current_size_gb = current_size / (1024 * 1024 * 1024)  # Convert to GB
    return current_size > size_limit_bytes, current_size_gb

def clean_temp_folder(temp_folder_path):
    """Delete all contents of temp folder"""
    try:
        if os.path.exists(temp_folder_path):
            shutil.rmtree(temp_folder_path)
            os.makedirs(temp_folder_path)  # Recreate empty temp folder
        return True
    except Exception as e:
        print(f"Error cleaning temp folder: {e}")
        return False 
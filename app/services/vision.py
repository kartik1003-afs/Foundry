from google.cloud import vision
from typing import List, Dict, Tuple
import io
import logging

logger = logging.getLogger(__name__)

class VisionService:
    def __init__(self):
        self.client = vision.ImageAnnotatorClient()

    def analyze_image(self, image_content: bytes) -> Tuple[List[str], List[str], Dict[str, str]]:
        try:
            image = vision.Image(content=image_content)
            
            # Get labels
            response = self.client.label_detection(image=image)
            labels = [label.description.lower() for label in response.label_annotations]
            
            # Get dominant colors
            response = self.client.image_properties(image=image)
            colors = []
            if response.image_properties_annotation:
                colors = [
                    f"rgb({int(color.color.red)},{int(color.color.green)},{int(color.color.blue)})"
                    for color in response.image_properties_annotation.dominant_colors.colors
                    if color.pixel_fraction > 0.1  # Only include significant colors
                ][:3]  # Take top 3 colors
            
            # Get additional attributes
            attributes = {}
            response = self.client.web_detection(image=image)
            if response.web_detection.best_guess_labels:
                attributes["best_guess"] = response.web_detection.best_guess_labels[0].label
                
            # Get text from image if any
            response = self.client.text_detection(image=image)
            if response.text_annotations:
                attributes["detected_text"] = response.text_annotations[0].description
            
            return labels, colors, attributes
            
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            return [], [], {}

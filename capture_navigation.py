import time
import subprocess
import requests

def capture_screenshot(account_type, filename):
    """Capture screenshot for a specific account type"""
    print(f"Capturing {account_type} navigation...")
    
    # Take screenshot using headless browser approach
    subprocess.run([
        "python3", "-c", f"""
import time
import subprocess
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1280,720')
    
    driver = webdriver.Chrome(options=options)
    driver.get('http://localhost:5000')
    time.sleep(3)
    
    # Try to click menu button to open sidebar
    try:
        menu_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="menu-button"], button svg, .hamburger-menu')
        menu_btn.click()
        time.sleep(1)
    except:
        pass
    
    driver.save_screenshot('{filename}')
    driver.quit()
    print('Screenshot saved: {filename}')
    
except ImportError:
    print('Selenium not available, using alternative method')
    import subprocess
    subprocess.run(['curl', '-s', 'http://localhost:5000'], capture_output=True)
    print('Alternative capture attempted for {account_type}')
"""
    ])

# Test connection first
try:
    response = requests.get('http://localhost:5000', timeout=5)
    print("Application is accessible")
    
    # Capture each account type
    capture_screenshot("client", "client_navigation.png")
    capture_screenshot("supervisor", "supervisor_navigation.png") 
    capture_screenshot("lac", "lac_navigation.png")
    
except Exception as e:
    print(f"Error accessing application: {e}")
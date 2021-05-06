const {Builder, By, Key, until} = require('selenium-webdriver');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const assert = require('assert');

chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());


/*(async function login() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('http://ec2-3-140-1-42.us-east-2.compute.amazonaws.com:4141');
    await driver.findElement(By.name("login")).click();
    await driver.findElement(By.name("userName")).sendKeys('a');
    await driver.findElement(By.name("password")).sendKeys('a');
    await driver.findElement(By.name("submit")).click();
    await driver.wait(until.titleIs('Home'), 1000);
    await driver.manage().getCookie("id");
  } finally {
    await driver.quit();
  }
})();*/

(async function example() {
  let driver =  new Builder().forBrowser('chrome').build();
  let driver2 = new Builder().forBrowser('chrome').build();
  driver.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
  driver2.manage().timeouts().implicitlyWait(10, TimeUnit.SECONDS);
  try {
    await driver.get('http://ec2-3-140-1-42.us-east-2.compute.amazonaws.com:4141');
    await driver.findElement(By.name("login")).click();
    await driver.findElement(By.name("userName")).sendKeys('a');
    await driver.findElement(By.name("password")).sendKeys('a');
    await driver.findElement(By.name("submit")).click();
    
    await driver2.get('http://ec2-3-140-1-42.us-east-2.compute.amazonaws.com:4141');
    await driver2.findElement(By.name("login")).click();
    await driver2.findElement(By.name("userName")).sendKeys('a');
    await driver2.findElement(By.name("password")).sendKeys('a');
    await driver2.findElement(By.name("submit")).click();
    await driver.findElement(By.name("waiting")).sendKeys(Key.ENTER);
    await driver2.findElement(By.name("waiting")).sendKeys(Key.ENTER);
    
  } finally {
    //await driver.quit();
  }
})();
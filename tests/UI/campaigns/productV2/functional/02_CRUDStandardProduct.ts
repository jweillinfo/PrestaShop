import type {BrowserContext, Page} from 'playwright';
import {expect} from 'chai';

// Import utils
import helper from '@utils/helpers';
import files from '@utils/files';
import testContext from '@utils/testContext';
import basicHelper from '@utils/basicHelper';

// Import pages
import dashboardPage from '@pages/BO/dashboard';
import createProductsPage from '@pages/BO/catalog/productsV2/add';
import productsPage from '@pages/BO/catalog/productsV2';
import foProductPage from '@pages/FO/product';

// Import common tests
import loginCommon from '@commonTests/BO/loginBO';
import {enableNewProductPageTest, disableNewProductPageTest} from '@commonTests/BO/advancedParameters/newFeatures';

// Import data
import ProductData from '@data/faker/product';

const baseContext: string = 'productV2_functional_CRUDStandardProduct';

describe('BO - Catalog - Products : CRUD standard product', async () => {
  let browserContext: BrowserContext;
  let page: Page;

  // Data to create standard product
  const newProductData: ProductData = new ProductData({
    type: 'standard',
    coverImage: 'cover.jpg',
    thumbImage: 'thumb.jpg',
    taxRule: 'FR Taux standard (20%)',
    tax: 20,
    quantity: 100,
    minimumQuantity: 2,
    status: true,
  });
  const editProductData: ProductData = new ProductData({
    type: 'standard',
    taxRule: 'FR Taux réduit (10%)',
    tax: 10,
    quantity: 100,
    minimumQuantity: 1,
    status: true,
  });

  // Pre-condition: Enable new product page
  enableNewProductPageTest(`${baseContext}_enableNewProduct`);

  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);
    await files.generateImage(newProductData.coverImage);
    await files.generateImage(newProductData.thumbImage);
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
    await files.deleteFile(newProductData.coverImage);
    await files.deleteFile(newProductData.thumbImage);
  });

  // 1 - Create product
  describe('Create product', async () => {
    it('should login in BO', async function () {
      await loginCommon.loginBO(this, page);
    });

    it('should go to \'Catalog > Products\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToProductsPage', baseContext);

      await dashboardPage.goToSubMenu(
        page,
        dashboardPage.catalogParentLink,
        dashboardPage.productsLink,
      );

      await productsPage.closeSfToolBar(page);

      const pageTitle: string = await productsPage.getPageTitle(page);
      await expect(pageTitle).to.contains(productsPage.pageTitle);
    });

    it('should click on \'New product\' button and check new product modal', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnNewProductButton', baseContext);

      const isModalVisible: boolean = await productsPage.clickOnNewProductButton(page);
      await expect(isModalVisible).to.be.true;
    });

    it('should check the standard product description', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkStandardProductDescription', baseContext);

      const productTypeDescription: string = await productsPage.getProductDescription(page);
      await expect(productTypeDescription).to.contains(productsPage.standardProductDescription);
    });

    it('should choose \'Standard product\'', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'chooseStandardProduct', baseContext);

      await productsPage.selectProductType(page, newProductData.type);

      const pageTitle: string = await createProductsPage.getPageTitle(page);
      await expect(pageTitle).to.contains(createProductsPage.pageTitle);
    });

    it('should go to new product page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToNewProductPage', baseContext);

      await productsPage.clickOnAddNewProduct(page);

      const pageTitle: string = await createProductsPage.getPageTitle(page);
      await expect(pageTitle).to.contains(createProductsPage.pageTitle);
    });

    it('should create standard product', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createStandardProduct', baseContext);

      await createProductsPage.closeSfToolBar(page);

      const createProductMessage: string = await createProductsPage.setProduct(page, newProductData);
      await expect(createProductMessage).to.equal(createProductsPage.successfulUpdateMessage);
    });

    it('should check the product header details', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkProductHeaderDetails', baseContext);

      const taxValue: number = await basicHelper.percentage(newProductData.price, newProductData.tax);

      const productHeaderSummary: object = await createProductsPage.getProductHeaderSummary(page);
      await Promise.all([
        expect(productHeaderSummary.priceTaxExc).to.equal(`€${(newProductData.price.toFixed(2))} tax excl.`),
        expect(productHeaderSummary.priceTaxIncl).to.equal(
          `€${(newProductData.price + taxValue).toFixed(2)} tax incl. (tax rule: ${newProductData.tax}%)`),
        expect(productHeaderSummary.quantity).to.equal(`${newProductData.quantity} in stock`),
        expect(productHeaderSummary.reference).to.contains(newProductData.reference),
      ]);
    });

    it('should check that the save button is changed to \'Save and publish\'', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkSaveButton', baseContext);

      const saveButtonName: string = await createProductsPage.getSaveButtonName(page);
      await expect(saveButtonName).to.equal('Save and publish');
    });
  });

  // 2 - View product
  describe('View product', async () => {
    it('should preview product', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'previewProduct', baseContext);

      // Click on preview button
      page = await createProductsPage.previewProduct(page);

      await foProductPage.changeLanguage(page, 'en');

      const pageTitle: string = await foProductPage.getPageTitle(page);
      await expect(pageTitle).to.contains(newProductData.name);
    });

    it('should check all product information', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkProductInformation', baseContext);

      const taxValue: number = await basicHelper.percentage(newProductData.price, newProductData.tax);

      const result: object = await foProductPage.getProductInformation(page);
      await Promise.all([
        await expect(result.name).to.equal(newProductData.name),
        await expect(result.price.toFixed(2)).to.equal((newProductData.price + taxValue).toFixed(2)),
        await expect(result.summary).to.equal(newProductData.summary),
        await expect(result.description).to.equal(newProductData.description),
      ]);
    });

    it('should go back to BO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goBackToBO', baseContext);

      // Go back to BO
      page = await foProductPage.closePage(browserContext, page, 0);

      const pageTitle: string = await createProductsPage.getPageTitle(page);
      await expect(pageTitle).to.contains(createProductsPage.pageTitle);
    });
  });

  // 3 - Edit product
  describe('Edit product', async () => {
    it('should edit the created product', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'editProduct', baseContext);

      const createProductMessage: string = await createProductsPage.setProduct(page, editProductData);
      await expect(createProductMessage).to.equal(createProductsPage.successfulUpdateMessage);
    });

    it('should check the product header details', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkEditedProductHeaderDetails', baseContext);

      const taxValue: number = await basicHelper.percentage(editProductData.price, editProductData.tax);

      const productHeaderSummary: object = await createProductsPage.getProductHeaderSummary(page);
      await Promise.all([
        expect(productHeaderSummary.priceTaxExc).to.equal(`€${(editProductData.price.toFixed(2))} tax excl.`),
        expect(productHeaderSummary.priceTaxIncl).to.equal(
          `€${(editProductData.price + taxValue).toFixed(2)} tax incl. (tax rule: ${editProductData.tax}%)`),
        expect(productHeaderSummary.quantity).to.equal(`${editProductData.quantity + newProductData.quantity} in stock`),
        expect(productHeaderSummary.reference).to.contains(editProductData.reference),
      ]);
    });
  });

  // 4 - View edited product
  describe('View edited product', async () => {
    it('should preview product', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'previewEditedProduct', baseContext);

      // Click on preview button
      page = await createProductsPage.previewProduct(page);

      await foProductPage.changeLanguage(page, 'en');

      const pageTitle: string = await foProductPage.getPageTitle(page);
      await expect(pageTitle).to.contains(editProductData.name);
    });

    it('should check all product information', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkEditedProductInformation', baseContext);

      const taxValue: number = await basicHelper.percentage(editProductData.price, editProductData.tax);

      const result: object = await foProductPage.getProductInformation(page);
      await Promise.all([
        await expect(result.name).to.equal(editProductData.name),
        await expect(result.price.toFixed(2)).to.equal((editProductData.price + taxValue).toFixed(2)),
        await expect(result.description).to.equal(editProductData.description),
      ]);
    });

    it('should go back to BO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goBackToBO2', baseContext);

      // Go back to BO
      page = await foProductPage.closePage(browserContext, page, 0);

      const pageTitle: string = await createProductsPage.getPageTitle(page);
      await expect(pageTitle).to.contains(createProductsPage.pageTitle);
    });
  });

  // 5 - Delete product
  describe('Delete product', async () => {
    it('should delete product', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'deleteProduct', baseContext);

      const createProductMessage: string = await createProductsPage.deleteProduct(page);
      await expect(createProductMessage).to.equal(productsPage.successfulDeleteMessage);
    });
  });

  // Post-condition: Disable new product page
  disableNewProductPageTest(`${baseContext}_disableNewProduct`);
});

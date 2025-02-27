// Import pages
import FOBasePage from '@pages/FO/FObasePage';

import type {Page} from 'playwright';

/**
 * Addresses page, contains functions that can be used on the page
 * @class
 * @extends FOBasePage
 */
class Addresses extends FOBasePage {
  public readonly pageTitle: string;

  public readonly addressPageTitle: string;

  public readonly addAddressSuccessfulMessage: string;

  public readonly updateAddressSuccessfulMessage: string;

  public readonly deleteAddressSuccessfulMessage: string;

  public readonly deleteAddressErrorMessage: string;

  private readonly addressBlock: string;

  private readonly addressBodyTitle: string;

  private readonly createNewAddressLink: string;

  private readonly editAddressLink: string;

  private readonly deleteAddressLink: string;

  /**
   * @constructs
   * Setting up texts and selectors to use on addresses page
   */
  constructor() {
    super();

    this.pageTitle = 'Addresses';
    this.addressPageTitle = 'Address';
    this.addAddressSuccessfulMessage = 'Address successfully added.';
    this.updateAddressSuccessfulMessage = 'Address successfully updated.';
    this.deleteAddressSuccessfulMessage = 'Address successfully deleted.';
    this.deleteAddressErrorMessage = 'Could not delete the address since it is used in the shopping cart.';

    // Selectors
    this.addressBlock = 'article.address';
    this.addressBodyTitle = `${this.addressBlock} .address-body h4`;
    this.createNewAddressLink = '#content div.addresses-footer a[data-link-action=\'add-address\']';
    this.editAddressLink = 'a[data-link-action=\'edit-address\']';
    this.deleteAddressLink = 'a[data-link-action=\'delete-address\']';
  }

  /*
  Methods
   */
  /**
   * Open create new address form
   * @param page {Page} Browser tab
   * @returns {Promise<void>}
   * @constructor
   */
  async openNewAddressForm(page: Page): Promise<void> {
    if (await this.elementVisible(page, this.createNewAddressLink, 2000)) {
      await this.clickAndWaitForNavigation(page, this.createNewAddressLink);
    }
  }

  /**
   * Get address position from its alias
   * @param page {Page} Browser tab
   * @param alias {string} Alias of the address
   * @return {Promise<number>}
   */
  async getAddressPosition(page: Page, alias: string): Promise<number> {
    const titles = await page.$$eval(
      this.addressBodyTitle,
      (all) => all.map((address) => address.textContent),
    );

    return titles.indexOf(alias) + 1;
  }

  /**
   * Go to edit address page in FO
   * @param page {Page} Browser tab
   * @param position {string} String of the position
   * @returns {Promise<void>}
   */
  async goToEditAddressPage(page: Page, position: string | number = 'last'): Promise<void> {
    const editButtons = await page.$$(this.editAddressLink);

    await Promise.all([
      page.waitForNavigation('networkidle'),
      editButtons[position === 'last' ? (editButtons.length - 1) : (position - 1)].click(),
    ]);
  }

  /**
   * Delete address in FO
   * @param page {Page} Browser tab
   * @param position {string} String of the position
   * @returns {Promise<string>}
   */
  async deleteAddress(page: Page, position: string | number = 'last'): Promise<string> {
    const deleteButtons = await page.$$(this.deleteAddressLink);

    await Promise.all([
      page.waitForNavigation('networkidle'),
      deleteButtons[position === 'last' ? (deleteButtons.length - 1) : (position - 1)].click(),
    ]);

    return this.getTextContent(page, this.notificationsBlock);
  }
}

export default new Addresses();

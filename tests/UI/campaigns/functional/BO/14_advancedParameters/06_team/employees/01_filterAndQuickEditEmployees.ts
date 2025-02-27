// Import utils
import helper from '@utils/helpers';
import testContext from '@utils/testContext';

// Import commonTests
import loginCommon from '@commonTests/BO/loginBO';

// Import pages
import dashboardPage from '@pages/BO/dashboard/index';
import employeesPage from '@pages/BO/advancedParameters/team/index';
import addEmployeePage from '@pages/BO/advancedParameters/team/add';

// Import data
import Employees from '@data/demo/employees';
import EmployeeData from '@data/faker/employee';

import {expect} from 'chai';
import type {BrowserContext, Page} from 'playwright';

const baseContext: string = 'functional_BO_advancedParameters_team_employees_filterAndQuickEditEmployees';

// Filter and quick edit Employees in BO
describe('BO - Advanced Parameters - Team : Filter and quick edit Employees', async () => {
  let browserContext: BrowserContext;
  let page: Page;

  let numberOfEmployees: number = 0;

  const createEmployeeData: EmployeeData = new EmployeeData({
    defaultPage: 'Orders',
    permissionProfile: 'Logistician',
    active: false,
  });

  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  it('should login in BO', async function () {
    await loginCommon.loginBO(this, page);
  });

  it('should go to \'Advanced Parameters > Team\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAdvancedParamsPage', baseContext);

    await dashboardPage.goToSubMenu(
      page,
      dashboardPage.advancedParametersLink,
      dashboardPage.teamLink,
    );

    await employeesPage.closeSfToolBar(page);

    const pageTitle = await employeesPage.getPageTitle(page);
    await expect(pageTitle).to.contains(employeesPage.pageTitle);
  });

  it('should reset all filters and get number of employees', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'resetFilterFirst', baseContext);

    numberOfEmployees = await employeesPage.resetAndGetNumberOfLines(page);
    await expect(numberOfEmployees).to.be.above(0);
  });

  // 1 : Create employee and Filter with all inputs and selects in grid table in BO
  describe('Create employee then filter the table', async () => {
    it('should go to add new employee page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToNewEmployeePage', baseContext);

      await employeesPage.goToAddNewEmployeePage(page);

      const pageTitle = await addEmployeePage.getPageTitle(page);
      await expect(pageTitle).to.contains(addEmployeePage.pageTitleCreate);
    });

    it('should create employee', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createEmployee', baseContext);

      const textResult = await addEmployeePage.createEditEmployee(page, createEmployeeData);
      await expect(textResult).to.equal(employeesPage.successfulCreationMessage);

      const numberOfEmployeesAfterCreation = await employeesPage.getNumberOfElementInGrid(page);
      await expect(numberOfEmployeesAfterCreation).to.be.equal(numberOfEmployees + 1);
    });

    [
      {
        args:
          {
            testIdentifier: 'filterId',
            filterType: 'input',
            filterBy: 'id_employee',
            filterValue: '1',
          },
      },
      {
        args:
          {
            testIdentifier: 'filterFirstName',
            filterType: 'input',
            filterBy: 'firstname',
            filterValue: createEmployeeData.firstName,
          },
      },
      {
        args:
          {
            testIdentifier: 'filterLastName',
            filterType: 'input',
            filterBy: 'lastname',
            filterValue: Employees.DefaultEmployee.lastName,
          },
      },
      {
        args:
          {
            testIdentifier: 'filterEmail',
            filterType: 'input',
            filterBy: 'email',
            filterValue: createEmployeeData.email,
          },
      },
      {
        args:
          {
            testIdentifier: 'filterActive',
            filterType: 'select',
            filterBy: 'active',
            filterValue: createEmployeeData.active ? '1' : '0',
          },
      },
    ].forEach((test) => {
      it(`should filter by ${test.args.filterBy} '${test.args.filterValue}'`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `${test.args.testIdentifier}`, baseContext);

        await employeesPage.filterEmployees(
          page,
          test.args.filterType,
          test.args.filterBy,
          test.args.filterValue,
        );

        const numberOfEmployeesAfterFilter = await employeesPage.getNumberOfElementInGrid(page);
        await expect(numberOfEmployeesAfterFilter).to.be.at.most(numberOfEmployees);

        for (let i = 1; i <= numberOfEmployeesAfterFilter; i++) {
          if (test.args.filterBy === 'active') {
            const employeeStatus = await employeesPage.getStatus(page, i);
            await expect(employeeStatus).to.equal(test.args.filterValue === '1');
          } else {
            const textColumn = await employeesPage.getTextColumnFromTable(page, i, test.args.filterBy);
            await expect(textColumn).to.contains(test.args.filterValue);
          }
        }
      });

      it('should reset all filters', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `${test.args.testIdentifier}Reset`, baseContext);

        const numberOfEmployeesAfterCreation = await employeesPage.resetAndGetNumberOfLines(page);
        await expect(numberOfEmployeesAfterCreation).to.be.above(numberOfEmployees);
      });
    });

    // 2 : Editing Employees from grid table
    describe('Quick edit Employees', async () => {
      it('should filter by Email address', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'filterForQuickEdit', baseContext);

        await employeesPage.filterEmployees(page, 'input', 'email', createEmployeeData.email);

        const numberOfEmployeesAfterFilter = await employeesPage.getNumberOfElementInGrid(page);
        await expect(numberOfEmployeesAfterFilter).to.be.at.most(numberOfEmployees);

        for (let i = 1; i <= numberOfEmployeesAfterFilter; i++) {
          const textColumn = await employeesPage.getTextColumnFromTable(page, i, 'email');
          await expect(textColumn).to.contains(createEmployeeData.email);
        }
      });

      [
        {args: {status: 'disable', enable: false}},
        {args: {status: 'enable', enable: true}},
      ].forEach((employeeStatus) => {
        it(`should ${employeeStatus.args.status} the employee`, async function () {
          await testContext.addContextItem(
            this,
            'testIdentifier',
            `${employeeStatus.args.status}Employee`,
            baseContext,
          );

          const isActionPerformed = await employeesPage.setStatus(
            page,
            1,
            employeeStatus.args.enable,
          );

          if (isActionPerformed) {
            const resultMessage = await employeesPage.getAlertSuccessBlockParagraphContent(page);
            await expect(resultMessage).to.contains(employeesPage.successfulUpdateStatusMessage);
          }

          const currentStatus = await employeesPage.getStatus(page, 1);
          await expect(currentStatus).to.be.equal(employeeStatus.args.enable);
        });
      });
    });

    // 3 : Delete employee
    describe('Delete employee', async () => {
      it('should filter list by email', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'filterForDelete', baseContext);

        await employeesPage.filterEmployees(page, 'input', 'email', createEmployeeData.email);

        const textEmail = await employeesPage.getTextColumnFromTable(page, 1, 'email');
        await expect(textEmail).to.contains(createEmployeeData.email);
      });

      it('should delete employee', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'deleteEmployee', baseContext);

        const textResult = await employeesPage.deleteEmployee(page, 1);
        await expect(textResult).to.equal(employeesPage.successfulDeleteMessage);
      });

      it('should reset filter and check the number of employees', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'resetAfterDelete', baseContext);

        const numberOfEmployeesAfterDelete = await employeesPage.resetAndGetNumberOfLines(page);
        await expect(numberOfEmployeesAfterDelete).to.be.equal(numberOfEmployees);
      });
    });
  });
});

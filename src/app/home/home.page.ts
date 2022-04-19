import { Component } from '@angular/core';
import { SQLiteDBConnection, capSQLiteChanges } from '@capacitor-community/sqlite';
import { SQLiteService } from '../services/sqlite.service';
import { ExpenseModel } from '../Models/ExpenseModel';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  public isWeb = false;

  private sqliteDbConnection: SQLiteDBConnection;

  constructor(private sqlite: SQLiteService) {}

  async ionViewDidEnter() {

    try {
      const ret = await this.sqlite.initializePlugin();
      if (ret) {
        const p: string = this.sqlite.platform;
        console.log(`plaform ${p}`);
        if( p === 'web') {
          this.isWeb = true;
          await customElements.whenDefined('jeep-sqlite');
          const jeepSqliteEl = document.querySelector('jeep-sqlite');
          if(jeepSqliteEl != null) {
            await this.sqlite.initWebStore();
            console.log(`>>>> isStoreOpen ${await jeepSqliteEl.isStoreOpen()}`);
            console.log(`>>>> jeepSqliteEl is defined`);
          } else {
            console.log('>>>> jeepSqliteEl is null');
          }
        }
        this.sqliteDbConnection = await this.sqlite
              .openConnection('testIssue256', false, 'no-encryption',
              1, true);
        const isTableExists = await this.sqliteDbConnection.isTable('Expenses');
        console.log(`>>>> isTableExists: ${JSON.stringify(isTableExists)}`);
        if(!isTableExists.result) {
          await this.firstRun();
        }
        const waitDuration = 5; // 5 seconds
        console.log(`>>>>> Waiting for ${waitDuration} seconds <<<<<`);
        await this.delay(waitDuration);
        /**** Second Run ****/
        await this.secondRun();
      }
    } catch(err) {
      const msg: string = err.message ? err.message : err;
      console.log(`Error: ${msg}`);
    }

  }
  async createExpensesTable(): Promise<capSQLiteChanges> {
    const query = `
          CREATE TABLE IF NOT EXISTS Expenses (
            ExpenseId TEXT PRIMARY KEY NOT NULL,
            Name TEXT NULL,
            Amount REAL NULL,
            Date INTEGER NULL,
            VatId TEXT NULL,
            ExpenseTypeId TEXT NULL,
            Image BLOB NULL,
            ExpenseTemplateId TEXT NULL,
            CreatedDate INTEGER NOT NULL,
            UserId TEXT NOT NULL,
            last_modified INTEGER DEFAULT (strftime('%s', 'now'))
          );
          CREATE TRIGGER IF NOT EXISTS Expenses_trigger_last_modified
          AFTER UPDATE ON Expenses
          FOR EACH ROW WHEN NEW.last_modified < OLD.last_modified
          BEGIN
              UPDATE Expenses SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
          END;
          `;
    try {
      return Promise.resolve(await this.sqliteDbConnection.execute(query));
    } catch (err)  {
      return Promise.reject(err);
    }
  }
  async initializeSynchronizationProcess(): Promise<void> {
    try {
      await this.sqliteDbConnection.createSyncTable();
      await this.sqliteDbConnection.setSyncDate(new Date().toISOString());
      const syncDate  = await this.sqliteDbConnection.getSyncDate();
      console.log(`>>> syncDate: ${JSON.stringify(syncDate)}`);
      return;
    } catch (err)  {
      return Promise.reject(err);
    }
  }
  async createExpense(expense: ExpenseModel): Promise<capSQLiteChanges> {
    const sqlQuery = `INSERT INTO Expenses (
      ExpenseId,
      Name,
      Amount,
      Date,
      VatId,
      ExpenseTypeId,
      Image,
      ExpenseTemplateId,
      CreatedDate,
      UserId)
      VALUES (?,?,?,?,?,?,?,?,?,?)`;

    const sqlValues = [
      expense.id,
      expense.name ? expense.name : null,
      expense.amount ? expense.amount : null,
      expense.date ? expense.date : null,
      expense.vatId ? expense.vatId : null,
      expense.typeId ? expense.typeId : null,
      expense.image ? expense.image : null,
      expense.templateId ? expense.templateId : null,
      expense.createdDate,
      expense.userId,
    ];
    try {
      const res =  await this.sqliteDbConnection.run(sqlQuery, sqlValues, false);
      return Promise.resolve(res);
    } catch (err ) {
      return Promise.reject(err);
    }
  }
  async firstRun(): Promise<void> {
    let changes: capSQLiteChanges;
    let expense: ExpenseModel = {};
    try {
      /****  First Run ****/
      changes = await this.createExpensesTable();
      console.log(`>>>> Create table Expenses: ${JSON.stringify(changes)}`);
      await this.initializeSynchronizationProcess();

      // create two expenses
      expense.createdDate = Math.round(new Date().getTime() / 1000);
      expense.id = 'ef5c57d5-b885-49a9-9c4d-8b340e4abdbc';
      expense.userId = 'bced3262-5d42-470a-9585-d3fd12c45452';
      changes = await this.createExpense(expense);
      console.log(`>>>> Create First Expense: ${JSON.stringify(changes)}`);
      if(changes.changes.lastId !== 1) {
        return Promise.reject(`Error: lastId != 1`);
      }
      expense = {};
      expense.createdDate = Math.round(new Date().getTime() / 1000);
      expense.id = 'a401c18d-053b-46e8-84ee-83da561c88c9';
      expense.userId = 'deaafccf-5b66-433d-a93f-495b0e141e74';
      changes = await this.createExpense(expense);
      if(changes.changes.lastId !== 2) {
        return Promise.reject(`Error: lastId != 2`);
      }
      console.log(`>>>> Create Second Expense: ${JSON.stringify(changes)}`);
      // export full
      const jsonObj = await this.sqliteDbConnection.exportToJson('full');
      console.log(`>>>> jsonObj.export full: ${JSON.stringify(jsonObj.export)} `);
      // test Json object validity
      const result = await this.sqlite
                            .isJsonValid(JSON.stringify(jsonObj.export));
      if(!result.result) {
        return Promise.reject('>>>> IsJsonValid "full" export failed ');
      }
      // set the new sync date
      await this.sqliteDbConnection.setSyncDate(new Date().toISOString());
      return Promise.resolve();
    } catch(err) {
      const msg: string = err.message ? err.message : err;
      return Promise.reject(`Error: ${msg}`);
    }
  }

  async secondRun(): Promise<void> {
    try {
      let changes: capSQLiteChanges;
      let expense: ExpenseModel = {};
      console.log(`>>>> Second Run`);
      expense = {};
      expense.createdDate = Math.round(new Date().getTime() / 1000);
      expense.id = '18b983f0-d048-4002-a5bc-b66872e4e3c0';
      expense.userId = '732ec3bc-3b01-4e02-b343-4442adc6782a';
      changes = await this.createExpense(expense);
      if(changes.changes.lastId !== 3) {
        return Promise.reject(`Error: lastId != 3`);
      }
      expense = {};
      expense.createdDate = Math.round(new Date().getTime() / 1000);
      expense.id = '9720c12f-baae-4797-99be-1f60931a47cd';
      expense.userId = '327f9ae6-649b-447b-8af6-6a8fcaba6be6';
      changes = await this.createExpense(expense);
      if(changes.changes.lastId !== 4) {
        return Promise.reject(`Error: lastId != 4`);
      }
      expense = {};
      expense.createdDate = Math.round(new Date().getTime() / 1000);
      expense.id = 'a6d51a72-bd05-4dc7-b33f-4ecfd7a22d94';
      expense.userId = '4f79ed76-d8a9-4eb6-8a31-ce4783bffc97';
      changes = await this.createExpense(expense);
      if(changes.changes.lastId !== 5) {
        return Promise.reject(`Error: lastId != 5`);
      }
      expense = {};
      expense.createdDate = Math.round(new Date().getTime() / 1000);
      expense.id = '80d5f7ab-aaf4-432b-a4e7-94414158f7bd';
      expense.userId = '7377c80f-30e5-49b6-ab1a-c40f080bcc9b';
      changes = await this.createExpense(expense);
      if(changes.changes.lastId !== 6) {
        return Promise.reject(`Error: lastId != 6`);
      }

      // export partial
      const pJsonObj = await this.sqliteDbConnection.exportToJson('partial');
      console.log(`>>>> pJsonObj.export partial: ${JSON.stringify(pJsonObj.export)} `);
      // test Json object validity
      const pResult = await this.sqlite
                            .isJsonValid(JSON.stringify(pJsonObj.export));
      if(!pResult.result) {
        return Promise.reject('IsJsonValid "partial" export failed ');
      }
    } catch(err) {
      const msg: string = err.message ? err.message : err;
      return Promise.reject(`Error: ${msg}`);
    }
  }
  async delay(ttime: number) {
    return new Promise((resolve) => {
        setTimeout(resolve,ttime*1000);
    });
  }
}

export interface ConversionReport {
  message: string;
  type: 'info' | 'warning' | 'error';
}

export interface ConversionResult {
  convertedSql: string;
  reports: ConversionReport[];
}

export class MySQLToPostgreSQLConverter {
  private reports: ConversionReport[] = [];

  private addReport(message: string, type: ConversionReport['type'] = 'info') {
    this.reports.push({ message, type });
  }

  convert(mysqlSql: string): ConversionResult {
    this.reports = [];
    let convertedSql = mysqlSql;

    // Data type conversions
    convertedSql = this.convertDataTypes(convertedSql);
    
    // Auto increment conversion
    convertedSql = this.convertAutoIncrement(convertedSql);
    
    // Engine and charset removal
    convertedSql = this.removeEngineAndCharset(convertedSql);
    
    // Quote identifier conversion
    convertedSql = this.convertQuoteIdentifiers(convertedSql);
    
    // Function conversions
    convertedSql = this.convertFunctions(convertedSql);
    
    // Limit syntax conversion
    convertedSql = this.convertLimitSyntax(convertedSql);

    return {
      convertedSql: convertedSql.trim(),
      reports: this.reports
    };
  }

  private convertDataTypes(sql: string): string {
    const typeConversions = [
      // Integer types
      { from: /\bTINYINT(\(\d+\))?/gi, to: 'SMALLINT', message: 'Converted TINYINT to SMALLINT' },
      { from: /\bMEDIUMINT(\(\d+\))?/gi, to: 'INTEGER', message: 'Converted MEDIUMINT to INTEGER' },
      { from: /\bINT(\(\d+\))?/gi, to: 'INTEGER', message: 'Converted INT to INTEGER' },
      { from: /\bBIGINT(\(\d+\))?/gi, to: 'BIGINT', message: 'BIGINT is compatible' },
      
      // String types
      { from: /\bTINYTEXT/gi, to: 'TEXT', message: 'Converted TINYTEXT to TEXT' },
      { from: /\bMEDIUMTEXT/gi, to: 'TEXT', message: 'Converted MEDIUMTEXT to TEXT' },
      { from: /\bLONGTEXT/gi, to: 'TEXT', message: 'Converted LONGTEXT to TEXT' },
      
      // Binary types
      { from: /\bTINYBLOB/gi, to: 'BYTEA', message: 'Converted TINYBLOB to BYTEA' },
      { from: /\bMEDIUMBLOB/gi, to: 'BYTEA', message: 'Converted MEDIUMBLOB to BYTEA' },
      { from: /\bLONGBLOB/gi, to: 'BYTEA', message: 'Converted LONGBLOB to BYTEA' },
      { from: /\bBLOB/gi, to: 'BYTEA', message: 'Converted BLOB to BYTEA' },
      
      // Date/Time types
      { from: /\bDATETIME/gi, to: 'TIMESTAMP', message: 'Converted DATETIME to TIMESTAMP' },
      { from: /\bYEAR(\(\d+\))?/gi, to: 'SMALLINT', message: 'Converted YEAR to SMALLINT' },
      
      // Boolean type
      { from: /\bTINYINT\(1\)/gi, to: 'BOOLEAN', message: 'Converted TINYINT(1) to BOOLEAN' },
    ];

    typeConversions.forEach(conversion => {
      if (conversion.from.test(sql)) {
        sql = sql.replace(conversion.from, conversion.to);
        this.addReport(conversion.message);
      }
    });

    return sql;
  }

  private convertAutoIncrement(sql: string): string {
    // Convert AUTO_INCREMENT to SERIAL
    if (/AUTO_INCREMENT/gi.test(sql)) {
      sql = sql.replace(/\bINTEGER\s+AUTO_INCREMENT/gi, 'SERIAL');
      sql = sql.replace(/\bINT\s+AUTO_INCREMENT/gi, 'SERIAL');
      sql = sql.replace(/\bBIGINT\s+AUTO_INCREMENT/gi, 'BIGSERIAL');
      sql = sql.replace(/\bAUTO_INCREMENT/gi, '');
      this.addReport('Converted AUTO_INCREMENT to SERIAL');
    }

    return sql;
  }

  private removeEngineAndCharset(sql: string): string {
    // Remove ENGINE clause
    if (/ENGINE\s*=/gi.test(sql)) {
      sql = sql.replace(/ENGINE\s*=\s*\w+/gi, '');
      this.addReport('Removed ENGINE clause (not supported in PostgreSQL)');
    }

    // Remove CHARSET clause
    if (/CHARSET\s*=/gi.test(sql)) {
      sql = sql.replace(/DEFAULT\s+CHARSET\s*=\s*\w+/gi, '');
      sql = sql.replace(/CHARSET\s*=\s*\w+/gi, '');
      this.addReport('Removed CHARSET clause (use PostgreSQL encoding instead)');
    }

    // Remove COLLATE clause
    if (/COLLATE\s*=/gi.test(sql)) {
      sql = sql.replace(/COLLATE\s*=\s*\w+/gi, '');
      this.addReport('Removed COLLATE clause (use PostgreSQL collation instead)');
    }

    return sql;
  }

  private convertQuoteIdentifiers(sql: string): string {
    // Convert backticks to double quotes
    if (/`/.test(sql)) {
      sql = sql.replace(/`([^`]+)`/g, '"$1"');
      this.addReport('Converted backtick identifiers to double quotes');
    }

    return sql;
  }

  private convertFunctions(sql: string): string {
    const functionConversions = [
      { from: /\bNOW\(\)/gi, to: 'CURRENT_TIMESTAMP', message: 'Converted NOW() to CURRENT_TIMESTAMP' },
      { from: /\bCURDATE\(\)/gi, to: 'CURRENT_DATE', message: 'Converted CURDATE() to CURRENT_DATE' },
      { from: /\bCURTIME\(\)/gi, to: 'CURRENT_TIME', message: 'Converted CURTIME() to CURRENT_TIME' },
      { from: /\bIFNULL\(/gi, to: 'COALESCE(', message: 'Converted IFNULL to COALESCE' },
    ];

    functionConversions.forEach(conversion => {
      if (conversion.from.test(sql)) {
        sql = sql.replace(conversion.from, conversion.to);
        this.addReport(conversion.message);
      }
    });

    return sql;
  }

  private convertLimitSyntax(sql: string): string {
    // Convert LIMIT offset, count to LIMIT count OFFSET offset
    const limitPattern = /\bLIMIT\s+(\d+)\s*,\s*(\d+)/gi;
    if (limitPattern.test(sql)) {
      sql = sql.replace(limitPattern, 'LIMIT $2 OFFSET $1');
      this.addReport('Converted MySQL LIMIT syntax to PostgreSQL format');
    }

    return sql;
  }
}
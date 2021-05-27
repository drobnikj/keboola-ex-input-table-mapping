# Keboola Input mapping

This actor parses the input table from the Apify <> Keboola extractor and maps the data into another task or actor input.
If you haven't used Apify <> Keboola integration yet, this tool is probably not what you're looking for and you
should read [this article](https://help.apify.com/en/articles/2003234-keboola-integration) to learn more about integration.

## Introduction

It is not possible to pass the input table from the Keboola extractor into any public actor. Because the Keboola extractor passed
the input table using key-value store and the storeId and key of the input table put into actor/task input. And because
storeId and key is not part of any public actor and will be omitted. This tool helps you run actor/task from the Keboola
extractor and map the input table into actor/task input.

## Use Case - Web Scraper

Imagine we have tabled data in a CSV in Keboola in the following format:
```csv
Title,URL,ID
Test1,http://example.com#1,product_1
Test2,http://example.com#2,product_2
Test3,http://example.com#3,product_3
Test4,http://example.com#4,product_4
Test5,http://example.com#5,product_5
```
We need to run an apify/web-scraper task, where the URL column will be used on input as the "Start URLs".
In this case, we'll create a new task for this actor. We will fill
"Target Task ID" with the name of the created web-scraper task and
"Input mapping function" with a simple JavaScript function that maps CSV into input.
```javascript
function inputMappingFunction({ currentInput, parsedInputTableCsv }) {
    const startUrls = parsedInputTableCsv.map((line) => {
        return { url: line['URL'] };
    });
    return {
        startUrls,
    };
}
```
We will save the task, go to Keboola, use the created task in Apify extractor, and select the table we
want to pass.
![Keboola-ex](./keboola-ex.png)
After we save and run this configuration, the task should run our target task and use the input created in the mapping function.

## Miscellaneous

If you're struggling with your Apify <> Keboola setup, please ask me for help or contact [Apify support](mailto:support@apify.com).

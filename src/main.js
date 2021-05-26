const Apify = require('apify');
const parse = require('csv-parse');
const _ = require('lodash');
const vm = require('vm');

const { utils: { log } } = Apify;
const apifyClient = Apify.newClient();

Apify.main(async () => {
    const input = await Apify.getInput();
    const { inputTableRecord, fields, inputMapping, targetActorId, targetTaskId } = input;

    /**
     * NOTE: It is not possible to metamorph into task. But we get task input and actor ID for task
     * and use to metamorph into.
     */
    let metamorphActorId;
    let metamorphInput;
    let metamorphOptions;
    if (targetActorId) {
        try {
            const actor = await apifyClient.actor(targetActorId).get();
            metamorphActorId = actor.id;
            metamorphInput = {};
        } catch (err) {
            throw new Error(`Cannot find actor with ${targetActorId}!`);
        }
    } else if (targetTaskId) {
        try {
            const task = await apifyClient.task(targetTaskId).get();
            metamorphActorId = task.actId;
            metamorphInput = task.input;
            metamorphOptions = task.options;
        } catch (err) {
            throw new Error(`Cannot find task with ${targetTaskId}!`);
        }
    } else {
        throw new Error('Target ActorId or TaskId has to be set!');
    }

    const parsedCsvData = [];
    if (inputTableRecord) {
        // Use apify-client, SDK cannot do streams.
        const { storeId, key } = inputTableRecord;
        const storeClient = await apifyClient.keyValueStore(storeId);
        const { value: recordStream } = await storeClient.getRecord(key, { stream: true });

        // Parse csv using with async generators
        const parser = recordStream.pipe(parse({ columns: true }));

        for await (const line of parser) {
            const updatedLine = Array.isArray(fields) && fields.length
                ? _.pick(line, fields)
                : line;
            parsedCsvData.push(updatedLine);
            // TODO: ?? Function that can be eval on each line
        }
    } else {
        log.warning('The inputTableRecord was not passed, the parsedInputTableCsv will be empty.');
    }

    let inputMappingFunction;
    try {
        inputMappingFunction = vm.runInThisContext(`(${inputMapping})`);
    } catch (err) {
        throw new Error(`Cannot load inputMapping function: ${err.message}\n${err.stack.substr(err.stack.indexOf('\n'))}`);
    }
    if (!_.isFunction(inputMappingFunction)) throw new Error('Parameter "inputMapping" is not a function!');

    const context = {
        originalInput: input,
        parsedInputTableCsv: parsedCsvData,
    };
    const inputMapped = await inputMappingFunction(context);

    if (!_.isObject(inputMapped)) {
        throw new Error('The inputMapping does not return object. It needs to return object as input for target actor/task run.');
    }

    const finalInput = { ...metamorphInput, ...inputMapped };
    // TODO: !!! This is workaround as Apify.metamorph did not use input. It happens in case target actor loads input using Apify.getValue('INPUT') not Apify.getInput() !!!
    await Apify.setValue('INPUT', finalInput);
    const finalOptions = metamorphOptions && metamorphOptions.build ? { build: metamorphOptions.build } : {};
    await Apify.metamorph(metamorphActorId, finalInput, finalOptions);
});

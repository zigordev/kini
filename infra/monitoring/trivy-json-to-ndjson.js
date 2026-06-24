#!/usr/bin/env node
const fs = require('fs');

const [inputPath, outputPath, projectName] = process.argv.slice(2);
if (!inputPath || !outputPath || !projectName) {
    console.error('Usage: node trivy-json-to-ndjson.js <input.json> <output.ndjson> <project>');
    process.exit(1);
}

const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const out = fs.createWriteStream(outputPath, { flags: 'w' });

function writeLine(obj) {
    out.write(JSON.stringify(obj) + '\n');
}

const results = input.Results || [];
for (const res of results) {
    const target = res.Target || projectName;

    if (Array.isArray(res.Vulnerabilities)) {
        for (const v of res.Vulnerabilities) {
            writeLine({
                project: projectName,
                Target: target,
                Class: 'vuln',
                Severity: v.Severity,
                VulnerabilityID: v.VulnerabilityID,
                PkgName: v.PkgName,
                InstalledVersion: v.InstalledVersion,
                FixedVersion: v.FixedVersion,
                Title: v.Title,
                PrimaryURL: v.PrimaryURL
            });
        }
    }

    if (Array.isArray(res.Secrets)) {
        for (const s of res.Secrets) {
            writeLine({
                project: projectName,
                Target: target,
                Class: 'secret',
                Severity: s.Severity,
                RuleID: s.RuleID,
                Category: s.Category,
                Match: s.Match
            });
        }
    }
}

out.end();
console.log(`Wrote NDJSON to ${outputPath}`);

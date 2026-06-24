#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

const [projectPath, outputPath, projectName] = process.argv.slice(2);
if (!projectPath || !outputPath || !projectName) {
    console.error('Usage: node npm-audit-to-ndjson.js <project-path> <output.ndjson> <project-name>');
    process.exit(1);
}

try {
    // Run npm audit and get JSON output
    const auditOutput = execSync('npm audit --json', {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
    });

    const auditData = JSON.parse(auditOutput);
    const out = fs.createWriteStream(outputPath, { flags: 'w' });

    function writeLine(obj) {
        out.write(JSON.stringify(obj) + '\n');
    }

    // Convert npm audit vulnerabilities to our NDJSON format
    if (auditData.vulnerabilities) {
        for (const [pkgName, vuln] of Object.entries(auditData.vulnerabilities)) {
            // Map npm severity to standard format
            const severity = (vuln.severity || 'unknown').toUpperCase();

            writeLine({
                project: projectName,
                Target: 'package-lock.json',
                Class: 'vuln',
                Severity: severity === 'MODERATE' ? 'MEDIUM' : severity,
                VulnerabilityID: vuln.via[0]?.source || 'NPM-AUDIT',
                PkgName: pkgName,
                InstalledVersion: vuln.range || 'unknown',
                FixedVersion: vuln.fixAvailable ? 'available' : 'none',
                Title: vuln.via[0]?.title || `${pkgName} vulnerability`,
                PrimaryURL: vuln.via[0]?.url || `https://npmjs.com/package/${pkgName}`
            });
        }
    }

    out.end();
    console.log(`Wrote ${Object.keys(auditData.vulnerabilities || {}).length} npm audit findings to ${outputPath}`);
} catch (error) {
    if (error.status === 1) {
        // npm audit returns exit code 1 when vulnerabilities are found
        // Parse the output anyway
        const auditData = JSON.parse(error.stdout);
        const out = fs.createWriteStream(outputPath, { flags: 'w' });

        function writeLine(obj) {
            out.write(JSON.stringify(obj) + '\n');
        }

        if (auditData.vulnerabilities) {
            for (const [pkgName, vuln] of Object.entries(auditData.vulnerabilities)) {
                const severity = (vuln.severity || 'unknown').toUpperCase();

                writeLine({
                    project: projectName,
                    Target: 'package-lock.json',
                    Class: 'vuln',
                    Severity: severity === 'MODERATE' ? 'MEDIUM' : severity,
                    VulnerabilityID: vuln.via[0]?.source || String(vuln.via[0]),
                    PkgName: pkgName,
                    InstalledVersion: vuln.range || 'unknown',
                    FixedVersion: vuln.fixAvailable ? 'available' : 'none',
                    Title: vuln.via[0]?.title || `${pkgName} vulnerability`,
                    PrimaryURL: vuln.via[0]?.url || `https://npmjs.com/package/${pkgName}`
                });
            }
        }

        out.end();
        console.log(`Wrote ${Object.keys(auditData.vulnerabilities || {}).length} npm audit findings to ${outputPath}`);
    } else {
        console.error('Error running npm audit:', error.message);
        process.exit(1);
    }
}


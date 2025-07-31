import { format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

export const parseTimeRangeToMinutes = (timeString) => {
    if (!timeString.includes('-')) {
        const [hour, minute] = timeString.split(':').map(Number);
        const start = hour * 60 + minute;
        return { start, end: start + 1 };
    }
    const [startStr, endStr] = timeString.split('-');
    let start = 0;
    let end = 24 * 60 - 1;
    if (startStr) {
        const [hour, minute] = startStr.split(':').map(Number);
        start = hour * 60 + minute;
    }
    if (endStr) {
        const [hour, minute] = endStr.split(':').map(Number);
        end = hour * 60 + minute;
    }
    return { start, end };
};

export const findScheduleConflicts = (dataMatriks) => {
    const schedulesByPortAndDate = {};
    for (const kapal in dataMatriks) {
        for (const dateKey in dataMatriks[kapal]) {
            if (!schedulesByPortAndDate[dateKey]) {
                schedulesByPortAndDate[dateKey] = {};
            }
            const jadwalDiHariIni = dataMatriks[kapal][dateKey];
            jadwalDiHariIni.forEach(item => {
                if (!schedulesByPortAndDate[dateKey][item.pelabuhan]) {
                    schedulesByPortAndDate[dateKey][item.pelabuhan] = [];
                }
                schedulesByPortAndDate[dateKey][item.pelabuhan].push({
                    kapal,
                    waktu: item.waktu,
                });
            });
        }
    }
    const allConflicts = [];
    for (const dateKey in schedulesByPortAndDate) {
        for (const pelabuhan in schedulesByPortAndDate[dateKey]) {
            const schedules = schedulesByPortAndDate[dateKey][pelabuhan];
            if (schedules.length < 2) continue;
            const n = schedules.length;
            const parsedTimes = schedules.map(s => parseTimeRangeToMinutes(s.waktu));
            const adj = Array.from({ length: n }, () => []);
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const timeA = parsedTimes[i];
                    const timeB = parsedTimes[j];
                    if (timeA.start < timeB.end && timeB.start < timeA.end) {
                        adj[i].push(j);
                        adj[j].push(i);
                    }
                }
            }
            const visited = Array(n).fill(false);
            for (let i = 0; i < n; i++) {
                if (!visited[i]) {
                    const componentIndices = [];
                    const stack = [i];
                    visited[i] = true;
                    while (stack.length > 0) {
                        const u = stack.pop();
                        componentIndices.push(u);
                        for (const v of adj[u]) {
                            if (!visited[v]) {
                                visited[v] = true;
                                stack.push(v);
                            }
                        }
                    }
                    if (componentIndices.length > 1) {
                        const conflictingSchedules = componentIndices.map(index => schedules[index]);
                        conflictingSchedules.sort((a, b) => a.kapal.localeCompare(b.kapal));
                        allConflicts.push({
                            date: dateKey,
                            port: pelabuhan,
                            kapal: conflictingSchedules.map(s => s.kapal),
                            waktu: conflictingSchedules.map(s => s.waktu),
                        });
                    }
                }
            }
        }
    }
    return allConflicts;
};

export const processJadwalData = (jadwal, allShipNames) => {
    if (!jadwal || jadwal.length === 0) {
        return { dataMatriks: {}, dateHeaders: [], kapalList: allShipNames };
    }
    const groupedSchedules = {};
    jadwal.forEach(item => {
        const key = `${item.nama_kapal}|${item.pelabuhan}|${item.waktu_tiba}`;
        if (!groupedSchedules[key]) {
            groupedSchedules[key] = [];
        }
        groupedSchedules[key].push(item);
    });
    const mergedJadwal = [];
    Object.values(groupedSchedules).forEach(group => {
        if (group.length > 1) {
            const arrivalOnly = group.find(item => item.waktu_tiba && !item.waktu_berangkat);
            const fullSchedule = group.find(item => item.waktu_tiba && item.waktu_berangkat);
            if (arrivalOnly && fullSchedule) {
                const combinedSchedule = {
                    ...arrivalOnly,
                    waktu_berangkat: fullSchedule.waktu_berangkat,
                    voyage: `${arrivalOnly.voyage} / ${fullSchedule.voyage}`
                };
                mergedJadwal.push(combinedSchedule);
                const otherItems = group.filter(item => item.id !== arrivalOnly.id && item.id !== fullSchedule.id);
                mergedJadwal.push(...otherItems);
            } else {
                mergedJadwal.push(...group);
            }
        } else {
            mergedJadwal.push(...group);
        }
    });
    const finalJadwal = mergedJadwal;
    const parseDisplayString = (isoString) => {
        if (!isoString) return null;
        const year = parseInt(isoString.substring(0, 4), 10);
        const month = parseInt(isoString.substring(5, 7), 10) - 1;
        const day = parseInt(isoString.substring(8, 10), 10);
        const hour = parseInt(isoString.substring(11, 13), 10);
        const minute = parseInt(isoString.substring(14, 16), 10);
        return new Date(year, month, day, hour, minute);
    };
    const allDates = finalJadwal.flatMap(item => [
        parseDisplayString(item.waktu_tiba),
        parseDisplayString(item.waktu_berangkat || item.waktu_tiba)
    ]);
    const startDate = startOfDay(new Date(Math.min(...allDates.map(d => d.getTime()))));
    const endDate = endOfDay(new Date(Math.max(...allDates.map(d => d.getTime()))));
    const dateHeaders = eachDayOfInterval({ start: startDate, end: endDate });
    const dataMatriks = {};
    allShipNames.forEach(kapal => { dataMatriks[kapal] = {}; });
    finalJadwal.forEach(item => {
        const tiba = parseDisplayString(item.waktu_tiba);
        const berangkat = parseDisplayString(item.waktu_berangkat) || tiba;
        const tibaDateKey = format(tiba, 'dd-MMM-yy', { locale: id });
        const berangkatDateKey = format(berangkat, 'dd-MMM-yy', { locale: id });
        const eta = item.waktu_tiba.substring(11, 16);
        const etd = item.waktu_berangkat ? item.waktu_berangkat.substring(11, 16) : "";
        if (tibaDateKey === berangkatDateKey) {
            if (!dataMatriks[item.nama_kapal][tibaDateKey]) { dataMatriks[item.nama_kapal][tibaDateKey] = []; }
            dataMatriks[item.nama_kapal][tibaDateKey].push({
                pelabuhan: item.pelabuhan,
                waktu: etd ? `${eta}-${etd}` : eta
            });
        } else {
            if (!dataMatriks[item.nama_kapal][tibaDateKey]) { dataMatriks[item.nama_kapal][tibaDateKey] = []; }
            dataMatriks[item.nama_kapal][tibaDateKey].push({
                pelabuhan: item.pelabuhan,
                waktu: `${eta}-`
            });
            if (!dataMatriks[item.nama_kapal][berangkatDateKey]) { dataMatriks[item.nama_kapal][berangkatDateKey] = []; }
            dataMatriks[item.nama_kapal][berangkatDateKey].push({
                pelabuhan: item.pelabuhan,
                waktu: `-${etd}`
            });
        }
    });
    return { dataMatriks, dateHeaders, kapalList: allShipNames.sort() };
};

export const parseJadwalText = (rawText) => {
  const lines = rawText.trim().split('\n');
  const parsedData = [];

  for (const line of lines) {
    if (line.trim() === '') continue;

    const parts = line.split(/\s+/).filter(Boolean);

    let jamEtd = 'N/A';
    let tglEtd = 'N/A';
    let hariEtd = '';
    
    let jamEta = '';
    let tglEta = '';
    let hariEta = '';

    let mainParts;

    // Cek apakah formatnya lengkap (ETA & ETD) atau hanya ETA
    if (parts.length >= 8) { // Format lengkap
        jamEtd = parts.pop();
        tglEtd = parts.pop();
        hariEtd = parts.pop();

        jamEta = parts.pop();
        tglEta = parts.pop();
        hariEta = parts.pop();
        
        mainParts = parts;
    } else if (parts.length >= 4) { // Format tujuan akhir (hanya ETA)
        jamEta = parts.pop();
        tglEta = parts.pop();
        hariEta = parts.pop();
        
        mainParts = parts;
    } else {
        continue; // Lewati baris yang sama sekali tidak valid
    }

    let portNameParts = [];
    for (const part of mainParts) {
      if (!isNaN(part) && part.indexOf('-') === -1) {
        break;
      }
      portNameParts.push(part);
    }
    const namaPelabuhan = portNameParts.join(' ');
    
    if (!namaPelabuhan) continue;

    parsedData.push({
      pelabuhan: namaPelabuhan,
      eta: `${tglEta} ${jamEta}`,
      etd: `${tglEtd} ${jamEtd}`, // Akan berisi 'N/A N/A' untuk tujuan akhir
    });
  }
  return parsedData;
};
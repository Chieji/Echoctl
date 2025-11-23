package com.pocketforge.shared.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import io.ktor.client.*
import io.ktor.client.plugins.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.launch

class TerminalScreen : Screen {
    @Composable
    override fun Content() {
        val scope = rememberCoroutineScope()
        var output by remember { mutableStateOf("") }
        var command by remember { mutableStateOf("") }

        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text("Terminal", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = command,
                onValueChange = { command = it },
                label = { Text("Command") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = {
                scope.launch {
                    // WebSocket connection to backend for PTY
                    val client = HttpClient {
                        install(WebSockets)
                    }
                    client.webSocket("ws://localhost:8080/terminal") {
                        send(Frame.Text(command))
                        val frame = incoming.receive() as Frame.Text
                        output += frame.readText() + "\n"
                    }
                    client.close()
                }
            }) {
                Text("Execute")
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text("Output:", style = MaterialTheme.typography.bodyLarge)
            Spacer(modifier = Modifier.height(8.dp))
            Text(output, modifier = Modifier.fillMaxSize())
        }
    }
}
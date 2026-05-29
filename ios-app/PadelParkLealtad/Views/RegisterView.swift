import SwiftUI

struct RegisterView: View {
    @EnvironmentObject var state: AppState

    @State private var name  = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var birth = ""
    @State private var level = "Principiante"
    @State private var errorMsg: String?

    private let levels = ["Principiante", "Intermedio", "Avanzado", "Competitivo"]

    var body: some View {
        ZStack {
            Color.navyInk.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    // Back
                    Button { state.screen = .welcome } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "chevron.left")
                            Text("Inicio")
                        }
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.lime)
                    }
                    .padding(.top, 56)

                    // Title
                    VStack(alignment: .leading, spacing: 4) {
                        Text("CREA TU\nTARJETA")
                            .font(.custom("BebasNeue-Regular", size: 44))
                            .foregroundColor(.white)
                            .lineSpacing(2)
                        Text("Llena el formulario para obtener tu tarjeta de socio.")
                            .font(.system(size: 13))
                            .foregroundColor(.white.opacity(0.5))
                    }

                    // Fields
                    VStack(spacing: 18) {
                        PPTextField(label: "Nombre completo",
                                    placeholder: "Ej. Juan García",
                                    text: $name)
                        PPTextField(label: "Correo electrónico",
                                    placeholder: "correo@ejemplo.com",
                                    text: $email,
                                    keyboardType: .emailAddress,
                                    capitalization: .never)
                        PPTextField(label: "Teléfono",
                                    placeholder: "4771234567",
                                    text: $phone,
                                    keyboardType: .phonePad,
                                    capitalization: .never)
                        PPTextField(label: "Fecha de nacimiento",
                                    placeholder: "DD/MM/AAAA",
                                    text: $birth,
                                    keyboardType: .numbersAndPunctuation,
                                    capitalization: .never)

                        // Level picker
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Nivel de juego")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.white.opacity(0.5))

                            Menu {
                                ForEach(levels, id: \.self) { l in
                                    Button(l) { level = l }
                                }
                            } label: {
                                HStack {
                                    Text(level)
                                        .foregroundColor(.white)
                                        .font(.system(size: 16))
                                    Spacer()
                                    Image(systemName: "chevron.up.chevron.down")
                                        .foregroundColor(.white.opacity(0.35))
                                        .font(.system(size: 13))
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 14)
                                .background(Color.navy)
                                .cornerRadius(10)
                            }
                        }
                    }

                    if let msg = errorMsg {
                        Text(msg)
                            .font(.system(size: 13))
                            .foregroundColor(Color(red: 1, green: 0.4, blue: 0.4))
                    }

                    Button { submit() } label: {
                        Text("Generar mi tarjeta")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.navyInk)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.lime)
                            .cornerRadius(14)
                    }
                    .padding(.bottom, 40)
                }
                .padding(.horizontal, 24)
            }
        }
    }

    private func submit() {
        let n = name.trimmingCharacters(in: .whitespaces)
        let e = email.trimmingCharacters(in: .whitespaces).lowercased()
        let p = phone.trimmingCharacters(in: .whitespaces)

        guard !n.isEmpty          else { errorMsg = "El nombre es requerido.";          return }
        guard e.contains("@")     else { errorMsg = "Ingresa un correo válido.";        return }
        guard !p.isEmpty          else { errorMsg = "El teléfono es requerido.";        return }
        errorMsg = nil

        let member = Member(
            id: Member.generateId(name: n, email: e),
            name: n, email: e, phone: p,
            birth: birth, level: level,
            joinedAt: Date()
        )
        state.save(member)
        APIService.register(member: member)
        state.screen = .generating

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
            state.screen = .main
        }
    }
}

struct PPTextField: View {
    let label: String
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var capitalization: TextInputAutocapitalization = .words

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.white.opacity(0.5))
            TextField(placeholder, text: $text)
                .foregroundColor(.white)
                .font(.system(size: 16))
                .keyboardType(keyboardType)
                .textInputAutocapitalization(capitalization)
                .autocorrectionDisabled()
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(Color.navy)
                .cornerRadius(10)
        }
    }
}
